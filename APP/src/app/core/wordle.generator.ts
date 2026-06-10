export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export class WordleGenerator {
  

    // genera la palabra diaria, segun el dia del dispositivo
    public static getDailyWord(dictionary: string[]): string {
        if (!dictionary || dictionary.length === 0) return '';

        const now = new Date();
        const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        const index = dateSeed % dictionary.length;
        
        return dictionary[index].toUpperCase();
    }


    // genera la semilla del dia para ver si se resetean los intentos
    public static getTodaySeed(): number {
        const now = new Date();
        return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    }

    // chequea el intento y da feedback de cada letra
    public static evaluateGuess(guess: string, targetWord: string): LetterStatus[] {
        const guessArr = guess.toUpperCase().split('');
        const targetArr = targetWord.toUpperCase().split('');
        const statuses: LetterStatus[] = Array(5).fill('absent');

        // aciertos exactos 
        for (let i = 0; i < 5; i++) {
        if (guessArr[i] === targetArr[i]) {
            statuses[i] = 'correct';
            // tacha para no evaluarlo de nuevo
            targetArr[i] = null as any; 
            guessArr[i] = null as any;
        }
        }

        // aciertos pero en otra posicion
        for (let i = 0; i < 5; i++) {
        if (guessArr[i] !== null) {
            const matchIndex = targetArr.indexOf(guessArr[i]);
            if (matchIndex > -1) {
            statuses[i] = 'present';
            // tacha la coincidencia encontrada
            targetArr[matchIndex] = null as any; 
            }
        }
        }

        return statuses;
    }
}