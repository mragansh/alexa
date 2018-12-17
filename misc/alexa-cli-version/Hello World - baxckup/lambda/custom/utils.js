class utility {
  constructor() {}
  isBST(date) {
    var d = new Date(date) || new Date();
    var starts = this.lastSunday(2, d.getFullYear());
    starts.setHours(1);
    var ends = this.lastSunday(9, d.getFullYear());
    starts.setHours(1);
    return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
  }

  lastSunday(month, year) {
    var d = new Date();
    var lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
    var day = lastDayOfMonth.getDay();
    return new Date(Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day));
  }

}

module.exports = utility;
