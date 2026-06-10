# Minijuegos

Un hub de minijuegos diseñado y desarrollado como un proyecto personal. Construido como una Progressive Web App (PWA) de ejecución completamente local, permitiendo jugar sin conexión a internet directamente desde el navegador o una vez instalado en dispositivos móviles.

## Juegos Disponibles

### Sudoku

El módulo de Sudoku no utiliza tableros pre-generados. Implementa un motor matemático en el cliente que construye niveles nuevos en tiempo real asegurando que sean 100% jugables. La generación de niveles sigue un algoritmo de tres fases:

1. Relleno de la Diagonal Principal: Se inicializa una matriz de 9x9. El algoritmo rellena los tres bloques de 3x3 que conforman la diagonal principal con números aleatorios del 1 al 9. Como estos bloques no comparten filas ni columnas entre sí, se pueden rellenar de forma inmediata sin causar conflictos, optimizando el rendimiento inicial.
2. Backtracking Recursivo (Resolución Completa): Una vez establecida la base diagonal, un algoritmo recursivo de fuerza bruta (backtracking) navega por las celdas vacías restantes. El algoritmo prueba números legales y retrocede (backtrack) si llega a un callejón sin salida, repitiendo el proceso hasta generar un tablero de 81 celdas matemáticamente perfecto y completamente resuelto.
3. Excavación y Validación de Solución Única: Dependiendo de la dificultad elegida (Fácil, Medio o Difícil), el sistema procede a eliminar celdas ("excavar agujeros"). Este es el paso más delicado: tras borrar cada número, un algoritmo de resolución secundario escanea el tablero para confirmar que sigue teniendo exactamente una única solución posible. Si el borrado de esa celda genera múltiples formas de resolver el Sudoku, el número se restaura y el algoritmo intenta eliminar una celda diferente. Esto garantiza que el jugador nunca tenga que adivinar o tomar decisiones al azar.

### Wordle

* Modalidad Dual: Implementación con soporte independiente para partidas en Español e Inglés.
* Diccionarios Estáticos: Validación de intentos y objetivos mediante archivos de datos JSON locales, evitando dependencias de APIs externas y reduciendo la latencia a cero.
* Semilla Determinista Diaria (Date Seed): La palabra del día se calcula utilizando la fecha local del dispositivo del usuario como base matemática para seleccionar un índice en el diccionario. Esto emula la mecánica global del juego original garantizando que la palabra sea idéntica durante todo el día, pero renovándose a la medianoche sin requerir sincronización con servidores externos.
* Lógica de Teclado Virtual: Seguimiento de prioridades de color (Correcto > Presente > Ausente) para actualizar el estado del teclado en pantalla según los intentos históricos guardados en la sesión.

Nota al pie: Gracias a [vermicida](https://github.com/vermicida/palabros/) y a [ed-fish](https://github.com/ed-fish/wordle-vocab/) por las palabras en español e ingles respectivamente.


## Tecnologías Utilizadas

* Framework Base: Angular (Arquitectura Standalone Components)
* Estilos e Interfaz: Tailwind CSS
* Gestión de Estado: RxJS (BehaviorSubjects)
* Despliegue Continuo: GitHub Actions integrado para compilación en rama gh-pages y publicación sobre dominio personalizado.

