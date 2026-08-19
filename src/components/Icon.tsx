import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowUpRightFromSquare,
  faArrowDown,
  faBan,
  faBars,
  faBell,
  faBolt,
  faBuilding,
  faCalendarDays,
  faChartLine,
  faCheck,
  faChessBoard,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleDot,
  faCircleExclamation,
  faCircleInfo,
  faCircleNotch,
  faCircleUser,
  faCircleXmark,
  faClipboardList,
  faClock,
  faDiagramProject,
  faDownload,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFileLines,
  faFilter,
  faFingerprint,
  faFire,
  faFolderOpen,
  faGauge,
  faGaugeHigh,
  faGear,
  faGlobe,
  faHashtag,
  faHourglassHalf,
  faHouse,
  faIdBadge,
  faInbox,
  faKey,
  faLightbulb,
  faLink,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMagnifyingGlassChart,
  faMinus,
  faNoteSticky,
  faPalette,
  faPlug,
  faPlus,
  faPrint,
  faRightFromBracket,
  faRobot,
  faRotateRight,
  faServer,
  faShareNodes,
  faShieldHalved,
  faSkullCrossbones,
  faTriangleExclamation,
  faUser,
  faUserSecret,
  faUsers,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Single registry of every icon used in the app. This is the ONLY place that
 * imports from @fortawesome/free-solid-svg-icons — keeps icon usage
 * consistent (one style, one weight) per spec §10/§26.
 */
const ICONS = {
  "arrow-left": faArrowLeft,
  "arrow-right": faArrowRight,
  "arrow-up": faArrowUp,
  "arrow-down": faArrowDown,
  "arrow-up-right-from-square": faArrowUpRightFromSquare,
  ban: faBan,
  bars: faBars,
  bell: faBell,
  bolt: faBolt,
  building: faBuilding,
  "calendar-days": faCalendarDays,
  "chart-line": faChartLine,
  check: faCheck,
  "chess-board": faChessBoard,
  "chevron-down": faChevronDown,
  "chevron-left": faChevronLeft,
  "chevron-right": faChevronRight,
  "chevron-up": faChevronUp,
  "circle-check": faCircleCheck,
  "circle-dot": faCircleDot,
  "circle-exclamation": faCircleExclamation,
  "circle-info": faCircleInfo,
  "circle-notch": faCircleNotch,
  "circle-user": faCircleUser,
  "circle-xmark": faCircleXmark,
  "clipboard-list": faClipboardList,
  clock: faClock,
  "diagram-project": faDiagramProject,
  download: faDownload,
  "ellipsis-vertical": faEllipsisVertical,
  envelope: faEnvelope,
  eye: faEye,
  "eye-slash": faEyeSlash,
  "file-lines": faFileLines,
  filter: faFilter,
  fingerprint: faFingerprint,
  fire: faFire,
  "folder-open": faFolderOpen,
  gauge: faGauge,
  "gauge-high": faGaugeHigh,
  gear: faGear,
  globe: faGlobe,
  hashtag: faHashtag,
  "hourglass-half": faHourglassHalf,
  house: faHouse,
  "id-badge": faIdBadge,
  inbox: faInbox,
  key: faKey,
  lightbulb: faLightbulb,
  link: faLink,
  "location-dot": faLocationDot,
  lock: faLock,
  "magnifying-glass": faMagnifyingGlass,
  "magnifying-glass-chart": faMagnifyingGlassChart,
  minus: faMinus,
  "note-sticky": faNoteSticky,
  palette: faPalette,
  plug: faPlug,
  plus: faPlus,
  print: faPrint,
  "right-from-bracket": faRightFromBracket,
  robot: faRobot,
  "rotate-right": faRotateRight,
  server: faServer,
  "share-nodes": faShareNodes,
  "shield-halved": faShieldHalved,
  "skull-crossbones": faSkullCrossbones,
  "triangle-exclamation": faTriangleExclamation,
  user: faUser,
  "user-secret": faUserSecret,
  users: faUsers,
  "wand-magic-sparkles": faWandMagicSparkles,
  xmark: faXmark,
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  spin?: boolean;
  /** Provide only when the icon conveys meaning on its own (rare — prefer
   * icon + visible text label per spec accessibility rules). */
  title?: string;
}

const SIZE_PX: Record<NonNullable<IconProps["size"]>, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export function Icon({ name, size = "md", className, spin, title }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={ICONS[name]}
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      className={className}
      spin={spin}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    />
  );
}
