
export class MathService {

    /**
     * Генерация случайного числа в диапазоне
     * - так же, может быть указан только первый параметр (from),
     * в таком случае диапазон будет выставлен
     * от 1 (включительно) до указанного числа
     * @example
     * generateRandomNumber(15): 1 - 15
     * generateRandomNumber(10, 25): 10 - 25
     * @param from - нижняя граница
     * @param to - верхняя граница
     */
    generateRandomNumber(from: number, to?: number): number {
        if (to === undefined) {
            return Math.round(Math.random() * from) + 1;
        }
        return Math.round(Math.random() * (to - from)) + from;
    }

}