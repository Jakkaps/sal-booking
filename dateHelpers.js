export function dateToWeekDay(date) {
  return date.toLocaleString("en-us", { weekday: "long" }).toLowerCase();
}

export function dateToDateString(date, longYear) {
  return `${date.getDate()}.${("0" + (date.getMonth() + 1)).slice(-2)}.${
    longYear ? date.getFullYear() : date.getYear().toString().slice(-2)
  }`;
}
