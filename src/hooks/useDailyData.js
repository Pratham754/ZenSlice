import { useState, useEffect, useCallback } from "react";
import { getLocalDateKey } from "../utils/dateUtils";

export default function useDailyData() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));
  const [appUsage, setAppUsage] = useState([]);
  const [screenTime, setScreenTime] = useState(0);
  const [icons, setIcons] = useState({});

  const fetchDaily = useCallback(async () => {
    if (!selectedDate) return;
    const [apps, uptime] = await Promise.all([
      window.api?.getUsageByDate?.(selectedDate),
      window.api?.getPCScreenTimeByDate?.(selectedDate),
    ]);
    if (Array.isArray(apps)) setAppUsage(apps);
    setScreenTime(uptime?.[0]?.duration || 0);
  }, [selectedDate]);

  useEffect(() => {
    fetchDaily();
    const cleanup = window.api?.onUsageUpdated?.(() => fetchDaily());
    return cleanup;
  }, [fetchDaily]);

  // Batch-fetch only missing icons
  useEffect(() => {
    const missing = appUsage.filter((a) => a.exe_path && !icons[a.exe_path]);
    if (!missing.length) return;
    Promise.all(missing.map((a) => window.api?.getAppIconByExe(a.exe_path))).then((results) => {
      setIcons((prev) => {
        const next = { ...prev };
        missing.forEach((a, i) => {
          next[a.exe_path] = results[i] ? `data:image/png;base64,${results[i]}` : null;
        });
        return next;
      });
    });
  }, [appUsage]); // icons intentionally omitted to avoid re-fetch loop

  return { selectedDate, setSelectedDate, appUsage, screenTime, icons };
}
