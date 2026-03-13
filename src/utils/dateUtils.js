// src/utils/dateUtils.js
// Centralized timezone-aware date key function

function getLocalDateKey(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

module.exports = { getLocalDateKey };