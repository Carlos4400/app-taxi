import zipfile
import xml.etree.ElementTree as ET
import re
import os

MESES = {
    'enero':'01', 'febrero':'02', 'marzo':'03', 'abril':'04',
    'mayo':'05', 'junio':'06', 'julio':'07', 'agosto':'08',
    'septiembre':'09', 'octubre':'10', 'noviembre':'11', 'diciembre':'12'
}

def parse_num(s):
    if not s:
        return 0.0
    s = s.replace('€','').replace('.','').replace(',','.').strip()
    if re.search(r'\d', s):
        try:
            return float(s)
        except:
            return 0.0
    return 0.0

def fmt_num(n):
    if n == int(n):
        return str(int(n))
    return ('%.2f' % n).replace('.', ',')

def parse_date(s):
    match = re.search(r'(\d+)\s+de\s+([a-z]+)\s+de\s+(\d+)', s, re.IGNORECASE)
    if match:
        day = match.group(1).zfill(2)
        month = MESES.get(match.group(2).lower(), '01')
        year = match.group(3)
        return f"{year}-{month}-{day}"
    match2 = re.search(r'(\d+)/(\d+)/(\d+)', s)
    if match2:
        day = match2.group(1).zfill(2)
        month = match2.group(2).zfill(2)
        year = match2.group(3)
        return f"{year}-{month}-{day}"
    return s

def main():
    ods_path = 'Contabilidad 2026.ods'
    # Fallback to check script dir if not in cwd
    if not os.path.exists(ods_path):
        script_ods = os.path.join(os.path.dirname(os.path.abspath(__file__)), ods_path)
        if os.path.exists(script_ods):
            ods_path = script_ods

    z = zipfile.ZipFile(ods_path)
    root = ET.fromstring(z.read('content.xml'))
    ns = {
        'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
        'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
    }

    records = []
    tables = root.findall('.//table:table', ns)
    
    # Exclude the last template sheet if any
    for t in tables[:-1]:
        sheet_name = t.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name', '')
        
        # Expand repeated and spanned columns
        expanded_grid = []
        for r in t.findall('.//table:table-row', ns):
            expanded_row = []
            for orig_c in r.findall('.//table:table-cell', ns):
                rep = int(orig_c.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated', 1))
                span = int(orig_c.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-spanned', 1))
                text_el = orig_c.find('.//text:p', ns)
                text_val = text_el.text if text_el is not None else ''
                for _ in range(rep):
                    expanded_row.extend([text_val] * span)
            expanded_grid.append(expanded_row)

        for R in range(7, len(expanded_grid) - 20, 32):
            for W in [5, 20, 35, 50, 65]:
                if R + 18 >= len(expanded_grid):
                    continue
                
                # Find date string in the neighborhood
                date_raw = ''
                for c_idx in range(max(0, W-5), min(len(expanded_grid[R]), W+5)):
                    cell_txt = expanded_grid[R][c_idx]
                    if re.search(r'\b20\d\d\b', cell_txt):
                        date_raw = cell_txt
                        break
                
                if not date_raw:
                    continue

                total_txt = expanded_grid[R+5][W+2] if W+2 < len(expanded_grid[R+5]) else ''
                total_val = parse_num(total_txt)
                
                if total_val <= 0:
                    continue

                nulos_val = parse_num(expanded_grid[R+5][W+4] if W+4 < len(expanded_grid[R+5]) else '')
                km_val = parse_num(expanded_grid[R+6][W+2] if W+2 < len(expanded_grid[R+6]) else '')
                propinas_val = parse_num(expanded_grid[R+10][W] if W < len(expanded_grid[R+10]) else '')
                horas_txt = expanded_grid[R+11][W] if W < len(expanded_grid[R+11]) else ''
                horas_val = parse_num(horas_txt)
                if horas_val <= 0:
                    horas_val = 8.0

                int_h = int(horas_val)
                frac_h = horas_val - int_h
                mins = int(round(frac_h * 60))
                
                end_h = 7 + int_h
                if mins >= 60:
                    end_h += 1
                    mins -= 60
                end_h %= 24
                end_time = f"{end_h:02d}:{mins:02d}"

                datafonos_val = parse_num(expanded_grid[R+10][W+4] if W+4 < len(expanded_grid[R+10]) else '')
                extras_val = parse_num(expanded_grid[R+11][W+4] if W+4 < len(expanded_grid[R+11]) else '')
                gasolina_val = parse_num(expanded_grid[R+12][W+4] if W+4 < len(expanded_grid[R+12]) else '')
                bonos_val = parse_num(expanded_grid[R+13][W+4] if W+4 < len(expanded_grid[R+13]) else '')
                agencias_val = parse_num(expanded_grid[R+14][W+4] if W+4 < len(expanded_grid[R+14]) else '')

                custom_note = ''
                for r_idx in range(R+20, min(len(expanded_grid), R+25)):
                    for c_idx in range(max(0, W-3), min(len(expanded_grid[r_idx]), W+10)):
                        val = expanded_grid[r_idx][c_idx].strip()
                        if val.startswith('Notas:'):
                            clean_val = val[6:].strip()
                            if clean_val and clean_val != '0' and not clean_val.startswith('0,00'):
                                custom_note = clean_val
                                break
                    if custom_note:
                        break

                records.append({
                    'sheet': sheet_name,
                    'date': parse_date(date_raw),
                    'total': total_val,
                    'nulos': nulos_val,
                    'km': km_val,
                    'propinas': propinas_val,
                    'datafonos': datafonos_val,
                    'extras': extras_val,
                    'gasolina': gasolina_val,
                    'bonos': bonos_val,
                    'agencias': agencias_val,
                    'note': custom_note,
                    'end_time': end_time
                })

    # Sort records by date ascending
    records.sort(key=lambda x: x['date'])

    # Build CSV output
    csv_lines = ['Fecha;Inicio;Fin;Tipo;Cantidad;Nota Entrada;Hora Entrada;Total Facturado;Kilómetros']
    
    for r in records:
        dt = r['date']
        tot = fmt_num(r['total'])
        km = fmt_num(r['km'])
        shift_note = r['note']
        end_time = r['end_time']
        
        entries = [
            ('propina', r['propinas']),
            ('datafono', r['datafonos']),
            ('extra', r['extras']),
            ('gasolina', r['gasolina']),
            ('agencia_bono', r['bonos']),
            ('agencia_bono', r['agencias']),
            ('nulo', r['nulos'])
        ]
        
        has_entries = False
        for t, val in entries:
            if val > 0:
                has_entries = True
                csv_lines.append(f"{dt};07:00;{end_time};{t};{fmt_num(val)};;12:00;{tot};{km}")
        
        if shift_note:
            has_entries = True
            csv_lines.append(f"{dt};07:00;{end_time};nota;0;{shift_note};{end_time};{tot};{km}")

        if not has_entries:
            csv_lines.append(f"{dt};07:00;{end_time};;;;;{tot};{km}")

    # Write to output file
    output_content = '\n'.join(csv_lines)
    
    # Save dynamically to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, 'historial_ods_importar.csv')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)
        
    # If executed from a different working directory (e.g. user workspace), save there too
    cwd = os.getcwd()
    if cwd != script_dir:
        cwd_file = os.path.join(cwd, 'historial_ods_importar.csv')
        try:
            with open(cwd_file, 'w', encoding='utf-8') as f:
                f.write(output_content)
        except:
            pass

    print(f"Success! Converted {len(records)} shifts and wrote {len(csv_lines)-1} CSV entry rows.")
    print("\nFirst 10 rows of generated CSV:")
    print('\n'.join(csv_lines[:11]))

if __name__ == '__main__':
    main()
