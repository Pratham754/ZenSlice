import { useState, useEffect, useCallback } from "react";
import { getLocalDateKey } from "../utils/dateUtils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getMondayOfWeek(offset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function formatWeeklyData(rawData, weekOffset = 0) {
  const monday = getMondayOfWeek(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const map = {};
  rawData.forEach(({ date, duration }) => {
    const d = new Date(getLocalDateKey(new Date(date)));
    if (d >= monday && d <= sunday) {
      const name = weekdays[(d.getDay() + 6) % 7];
      map[name] = (map[name] || 0) + duration;
    }
  });

  return weekdays.map((day) => ({ name: day, duration: map[day] || 0 }));
}

export function formatWeekLabel(offset) {
  const monday = getMondayOfWeek(offset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} - ${sunday.toLocaleDateString("en-US", opts)}`;
}

export default function useWeeklyData() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [rawData, setRawData] = useState([]);
  const [earliestDate, setEarliestDate] = useState(null);

  useEffect(() => {
    window.api?.getEarliestDate?.().then((d) => {
      if (d) setEarliestDate(new Date(`${d}T00:00:00`));
    });
  }, []);

  const refresh = useCallback(async () => {
    const data = await window.api?.getAllHistoricalData?.();
    if (Array.isArray(data)) setRawData(data);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const goBack = useCallback(() => {
    const next = weekOffset - 1;
    const monday = getMondayOfWeek(next);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    if (!earliestDate || sunday >= earliestDate) setWeekOffset(next);
  }, [weekOffset, earliestDate]);

  const goForward = useCallback(() => {
    if (weekOffset < 0) setWeekOffset((p) => p + 1);
  }, [weekOffset]);

  return {
    weeklyData: formatWeeklyData(rawData, weekOffset),
    weekOffset, goBack, goForward, refresh,
  };
}
