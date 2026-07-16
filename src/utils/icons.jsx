// src/utils/icons.jsx
// Inline SVG icon components — avoids @mui/icons-material dependency
// All icons are from Material Design icon set (Apache 2.0)

import { SvgIcon } from "@mui/material";

export const ExpandMoreIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
  </SvgIcon>
);

export const ExpandLessIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
  </SvgIcon>
);

export const LanguageIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
  </SvgIcon>
);

export const WarningAmberIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
  </SvgIcon>
);

export const AccessTimeIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 14.5A6.5 6.5 0 1 1 18.5 12 6.51 6.51 0 0 1 12 18.5zm.5-11h-1v4.25l3.5 2.1.5-.82-3-1.78z" />
  </SvgIcon>
);

export const DeleteOutlineIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z" />
  </SvgIcon>
);

export const AddCircleOutlineIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </SvgIcon>
);

export const PlayArrowIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </SvgIcon>
);

export const StopIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </SvgIcon>
);

export const ClearIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </SvgIcon>
);

export const FolderOpenIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z" />
  </SvgIcon>
);

export const EditIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </SvgIcon>
);