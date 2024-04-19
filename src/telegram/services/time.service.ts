export class TimeService {

  /**
   * Получаем кол-во миллисекунд до начала (00:00:00) следующего дня
   * @param {Date} dateNow - в формате new Date("2024-03-09T11:25:27.663Z")
   * @param updateTime
   */
  getMillisecondsToNextDay(dateNow: Date, updateTime = 0) {
    const now = new Date();

    // завтрашняя дата
    const tomorrow = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() + 1,
      updateTime,
    );

    return Date.parse(String(tomorrow)) - Date.parse(String(now)); // разница в миллисекундах
  }

  /**
   * Преобразует миллисекунды в формат HH:MM:SS
   * @param milliseconds
   */
  millisecondsToTime(milliseconds: number) {
    const date = new Date(milliseconds);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Получить даты следующих понедельников в необходимом кол-ве
   * @param numWeeks
   */
  getNextMondays(numWeeks: number) {
    const now = new Date(); // текущая дата и время
    const currentDay = now.getDay(); // текущий день недели (0 - воскресенье, 1 - понедельник, ..., 6 - суббота)

    // Вычисляем количество дней до следующего понедельника
    const daysUntilMonday = currentDay === 1 ? 7 : 1 - currentDay + 7;

    const nextMondays: string[] = [];
    for (let i = 0; i < numWeeks; i++) {
      // Вычисляем дату следующего понедельника
      const nextMonday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysUntilMonday + i * 7,
      );
      const formattedDate = this.formatDate(nextMonday); // Преобразовываем дату в формат DD.MM.YYYY
      nextMondays.push(formattedDate);
    }

    return nextMondays;
  }

  /**
   * Форматирование Date в формат "DD.MM.YYYY"
   * @param date
   */
  formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Получаем текущую дату в формате "03.06.2023"
   */
  getCurrentDate() {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   *   Функция для преобразования строки с датой в объект Date
   */
  getDateFromString(dateString: string) {
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(year, month - 1, day); // Месяцы в объекте Date начинаются с 0
  };
}
