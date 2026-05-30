# Graph Report - .  (2026-05-29)

## Corpus Check
- 181 files · ~214,829 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 621 nodes · 1391 edges · 77 communities (67 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Iconos UI|Iconos UI]]
- [[_COMMUNITY_Configuracion y Plugins App|Configuracion y Plugins App]]
- [[_COMMUNITY_Sincronizacion Firestore y Admin|Sincronizacion Firestore y Admin]]
- [[_COMMUNITY_Iconos UI (2)|Iconos UI (2)]]
- [[_COMMUNITY_Dialogos de Entradas|Dialogos de Entradas]]
- [[_COMMUNITY_Dependencias del Proyecto|Dependencias del Proyecto]]
- [[_COMMUNITY_Pantallas CalendarioTurnos|Pantallas Calendario/Turnos]]
- [[_COMMUNITY_Configuracion Contable|Configuracion Contable]]
- [[_COMMUNITY_Calculo Contable de Turnos|Calculo Contable de Turnos]]
- [[_COMMUNITY_Documentacion y Arquitectura|Documentacion y Arquitectura]]
- [[_COMMUNITY_Config TypeScript|Config TypeScript]]
- [[_COMMUNITY_Parseo CSV  Turnos|Parseo CSV / Turnos]]
- [[_COMMUNITY_Manifest PWA|Manifest PWA]]
- [[_COMMUNITY_Tarjetas y Formato|Tarjetas y Formato]]
- [[_COMMUNITY_Carga de Estado|Carga de Estado]]
- [[_COMMUNITY_Config TS (node)|Config TS (node)]]
- [[_COMMUNITY_Almacenamiento Local|Almacenamiento Local]]
- [[_COMMUNITY_Consultas de Turnos|Consultas de Turnos]]
- [[_COMMUNITY_Conversion ODS a CSV|Conversion ODS a CSV]]
- [[_COMMUNITY_Estilos de Tarjetas|Estilos de Tarjetas]]
- [[_COMMUNITY_Calculo de Semanas|Calculo de Semanas]]
- [[_COMMUNITY_Test Instrumentado Android|Test Instrumentado Android]]
- [[_COMMUNITY_Test Unitario Android|Test Unitario Android]]
- [[_COMMUNITY_Actividad Android Principal|Actividad Android Principal]]
- [[_COMMUNITY_Entrega de Turno|Entrega de Turno]]
- [[_COMMUNITY_fmt|fmt]]
- [[_COMMUNITY_ASSETS|ASSETS]]
- [[_COMMUNITY_inyectarVersion|inyectarVersion]]
- [[_COMMUNITY_config|config]]
- [[_COMMUNITY_buildBackupPayload|buildBackupPayload]]
- [[_COMMUNITY_fmtDate|fmtDate]]
- [[_COMMUNITY_EditEntryDialog|EditEntryDialog]]

## God Nodes (most connected - your core abstractions)
1. `App()` - 30 edges
2. `Turno` - 19 edges
3. `compilerOptions` - 18 edges
4. `AppSettings` - 18 edges
5. `fmtKmNumber()` - 17 edges
6. `Shell()` - 16 edges
7. `IconBack()` - 15 edges
8. `fmtDuration()` - 14 edges
9. `fmt()` - 12 edges
10. `CurrentState` - 12 edges

## Surprising Connections (you probably didn't know these)
- `fmt()` --calls--> `fmtMoney()`  [INFERRED]
  mainAntiguo.tsx → src/logic/formatters.ts
- `DurationCardValue()` --calls--> `splitDurationLabel()`  [INFERRED]
  mainAntiguo.tsx → src/logic/formatters.ts
- `App()` --calls--> `fmtDuration()`  [INFERRED]
  mainAntiguo.tsx → src/logic/formatters.ts
- `App()` --calls--> `fmtKmNumber()`  [INFERRED]
  mainAntiguo.tsx → src/logic/formatters.ts
- `CAMBIOS_AGENT.md (registro de cambios)` --implements--> `Formato de entrada de CAMBIOS_AGENT.md`  [INFERRED]
  CAMBIOS_AGENT.md → AGENTS.md

## Hyperedges (group relationships)
- **Pipeline CI/CD (calidad, APK, PWA)** — workflows_ci, workflows_android, workflows_pages [EXTRACTED 0.85]
- **Refactor seguro de main.tsx con red de tests** — concept_refactor_incremental, concept_tests_caracterizacion, concept_contabilidad, concept_main_tsx [EXTRACTED 0.85]

## Communities (77 total, 10 thin omitted)

### Community 0 - "Iconos UI"
Cohesion: 0.09
Nodes (60): IconMoneyBag(), IconPencilNeon(), IconTimer(), ConfirmDialog(), DurationCardValue(), IconAgency(), IconCard(), IconCoin() (+52 more)

### Community 1 - "Configuracion y Plugins App"
Cohesion: 0.03
Nodes (26): ApkInstaller, ApkInstallerPluginType, AppSettings, BackupMenuActionId, ConfirmDialogProps, CurrentState, EditTurnoState, Entry (+18 more)

### Community 2 - "Sincronizacion Firestore y Admin"
Cohesion: 0.06
Nodes (41): migrarLocalStorageAFirestore(), migrarLocalStorageAFirestore(), useFirestoreSync(), fmtKm(), AdminListScreen(), AdminUserView(), AppSettings, ConfigTab() (+33 more)

### Community 3 - "Iconos UI (2)"
Cohesion: 0.06
Nodes (39): IconPercent(), IconAgenda(), IconChart(), IconClipboard(), IconPlay(), IconReservaWrite(), IconRocket(), IconAdminNeon() (+31 more)

### Community 4 - "Dialogos de Entradas"
Cohesion: 0.08
Nodes (30): EditEntryDialog(), EntryTypeMetaForDialog, IconDel(), EntryTypeMetaForNotes, UseFirestoreSyncProps, timeNow(), today(), AddEntryScreen() (+22 more)

### Community 5 - "Dependencias del Proyecto"
Cohesion: 0.06
Nodes (32): dependencies, @capacitor/core, @capacitor/filesystem, @capacitor/share, firebase, html2canvas, react, react-dom (+24 more)

### Community 6 - "Pantallas Calendario/Turnos"
Cohesion: 0.07
Nodes (13): IconPause(), IconPlay(), getDaysInMonth(), getStartOffset(), CalendarScreen(), ConfirmEndScreen(), PantallaTurnos(), TodayHistoryScreen() (+5 more)

### Community 7 - "Configuracion Contable"
Cohesion: 0.12
Nodes (28): AccountingSettings, getAccountingPeriodLabel(), getMesLabel(), MESES_ABREVIADOS, MESES_COMPLETOS, formatWeekRange(), formatWeekRangeFull(), getCurrentOpenWeekId() (+20 more)

### Community 8 - "Calculo Contable de Turnos"
Cohesion: 0.12
Nodes (24): App(), buildTurnoConfigFromSettings(), calcularResumenContableTurnos(), calcularTotalesTurnos(), calcularTurnoContable(), formatWeekRange(), formatWeekRangeFull(), getAccountingPeriodLabel() (+16 more)

### Community 9 - "Documentacion y Arquitectura"
Cohesion: 0.14
Nodes (24): Formato de entrada de CAMBIOS_AGENT.md, Politica de registro de cambios (AGENTS.md), Analisis del Plan Profesional por Fases, CAMBIOS_AGENT.md (registro de cambios), Arquitectura por carpetas de src/, Capacitor (empaquetado Android / APK), Contabilidad (regla de oro), Firebase Auth + Cloud Firestore (+16 more)

### Community 10 - "Config TypeScript"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowSyntheticDefaultImports, esModuleInterop, isolatedModules, jsx, lib, module (+12 more)

### Community 11 - "Parseo CSV / Turnos"
Cohesion: 0.26
Nodes (10): CSVEntry, CSVTurno, parseCSVLine(), parseCSVToHistory(), ensureTurnosDiaLibreContable(), getTurnosByCalendarMonth(), getTurnosByCalendarYear(), mergeTurnos() (+2 more)

### Community 12 - "Manifest PWA"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, name, orientation, scope (+4 more)

### Community 13 - "Tarjetas y Formato"
Cohesion: 0.29
Nodes (8): DurationCardValue(), ConfirmDialogProps, fmt(), MainCard(), SmallCard(), fmtMoney(), fmtMoneyNumber(), splitDurationLabel()

### Community 14 - "Carga de Estado"
Cohesion: 0.22
Nodes (8): loadCurrent(), LoadedCurrentState, LoadedWeekOverride, loadHistory(), loadNotes(), loadReservations(), loadSettings(), loadWeekOverrides()

### Community 15 - "Config TS (node)"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 16 - "Almacenamiento Local"
Cohesion: 0.25
Nodes (8): loadCurrent(), loadNotes(), loadReservations(), loadSettings(), loadWeekOverrides(), readLocalJSON(), userStorageKey(), writeUserLocalJSON()

### Community 17 - "Consultas de Turnos"
Cohesion: 0.29
Nodes (7): getTurnosByCalendarMonth(), getTurnosByCalendarYear(), loadHistory(), mergeTurnos(), parseCSVLine(), parseCSVToHistory(), sortTurnosByDateDesc()

### Community 18 - "Conversion ODS a CSV"
Cohesion: 0.70
Nodes (4): fmt_num(), main(), parse_date(), parse_num()

### Community 19 - "Estilos de Tarjetas"
Cohesion: 0.60
Nodes (3): TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES

### Community 20 - "Calculo de Semanas"
Cohesion: 0.50
Nodes (4): getTurnoAccountingWeekId(), getWeekId(), getWeekStartDate(), groupTurnosByWeek()

### Community 25 - "fmt"
Cohesion: 0.67
Nodes (3): fmt(), MainCard(), SmallCard()

## Knowledge Gaps
- **168 isolated node(s):** `config`, `ApkInstallerPluginType`, `ApkInstaller`, `Entry`, `TurnoConfig` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `Calculo Contable de Turnos` to `Iconos UI`, `Configuracion y Plugins App`, `Consultas de Turnos`, `Calculo de Semanas`, `fmt`, `fmtDate`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `fmtKmNumber()` connect `Iconos UI` to `Sincronizacion Firestore y Admin`, `Pantallas Calendario/Turnos`, `Configuracion Contable`, `Calculo Contable de Turnos`, `Parseo CSV / Turnos`, `Tarjetas y Formato`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `fmtDuration()` connect `Iconos UI` to `Calculo Contable de Turnos`, `Tarjetas y Formato`, `Pantallas Calendario/Turnos`, `Configuracion Contable`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `App()` (e.g. with `fmtDuration()` and `fmtKmNumber()`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `ApkInstallerPluginType`, `ApkInstaller` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Iconos UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09272151898734177 - nodes in this community are weakly interconnected._
- **Should `Configuracion y Plugins App` be split into smaller, more focused modules?**
  _Cohesion score 0.028169014084507043 - nodes in this community are weakly interconnected._