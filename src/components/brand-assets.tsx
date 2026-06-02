import type { CSSProperties, FC } from "react";

const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";
const BRAND_HERO = "/brand/brand-taxi-hero.png";

type BrandTaxiIconProps = {
  size?: 18 | 20 | 24 | 28 | number;
  variant?: "primary" | "alternate";
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiIcon: FC<BrandTaxiIconProps> = ({
  size = 20,
  variant = "primary",
  alt = "Taxi",
  style,
}) => (
  <img
    src={variant === "alternate" ? BRAND_MINI_18 : BRAND_MINI_20}
    width={size}
    height={size}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      objectFit: "contain",
      flexShrink: 0,
      ...style,
    }}
  />
);

type BrandTaxiLogoProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiLogo: FC<BrandTaxiLogoProps> = ({
  width = 156,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_LOGO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      ...style,
    }}
  />
);

type BrandTaxiHeroProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiHero: FC<BrandTaxiHeroProps> = ({
  width = 184,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_HERO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "78%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      filter:
        "drop-shadow(0 0 18px rgba(251, 191, 36, 0.20)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.12))",
      ...style,
    }}
  />
);
