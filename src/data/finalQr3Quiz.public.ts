// src/data/finalQr3Quiz.public.ts
export type QChoice = { id: string; label: string };
export type QQuestionPublic = { id: string; text: string; choices: QChoice[] };

export const QR3_PASS_SCORE = 10;

const DEBUG = true;

export const QUESTIONS: QQuestionPublic[] = [
  // Bloque A — Casa de Héctor
  {
    id: "A1",
    text: "¿Qué indica que NO fue un robo común?",
    choices: [
      { id: "A", label: "Se llevaron electrodomésticos y ropa" },
      { id: "B", label: "Hay signos de pelea en todas las habitaciones" },
      { id: "C", label: "Parece una búsqueda dirigida por material específico" },
      { id: "D", label: "Hay marcas de incendio" },
    ],
  },
  {
    id: "A2",
    text: "¿Qué elemento es el “puente” inmediato hacia el caso Sofía?",
    choices: [
      { id: "A", label: "Ticket de farmacia" },
      { id: "B", label: "Recorte de diario de búsqueda de Sofía" },
      { id: "C", label: "Plano del barrio" },
      { id: "D", label: "Llaves del gerente" },
    ],
  },
  {
    id: "A3",
    text: "¿De dónde proviene la info del pendrive?",
    choices: [
      { id: "A", label: "Del celular personal de Héctor" },
      { id: "B", label: "De la computadora del colegio" },
      { id: "C", label: "Del departamento/casa del gerente Lagos" },
      { id: "D", label: "De la casa de Beatriz" },
    ],
  },
  {
    id: "A4",
    text: "¿Para qué parece haber sido usado el material del pendrive?",
    choices: [
      { id: "A", label: "Entretenimiento personal" },
      { id: "B", label: "Chantaje / control" },
      { id: "C", label: "Investigación periodística publicada" },
      { id: "D", label: "Videos familiares" },
    ],
  },
  {
    id: "A5",
    text: "¿Qué significa el tatuaje dentro del caso?",
    choices: [
      { id: "A", label: "Un gusto estético de la víctima" },
      { id: "B", label: "Un símbolo repetido que identifica pertenencia a una red" },
      { id: "C", label: "Una moda de un bar" },
      { id: "D", label: "Un dibujo infantil sin valor" },
    ],
  },
  {
    id: "A6",
    text: "¿Quién entró a la casa de Héctor según lo que se reconstruye después?",
    choices: [
      { id: "A", label: "Un ladrón al azar" },
      { id: "B", label: "La policía" },
      { id: "C", label: "Eduardo (padre de Sofía)" },
      { id: "D", label: "Beatriz (suegra)" },
    ],
  },

  // Bloque B — Sofía / colegio / denuncias
  {
    id: "B1",
    text: "¿Qué se sabe con certeza sobre Sofía?",
    choices: [
      { id: "A", label: "Murió en un accidente de tránsito" },
      { id: "B", label: "Desapareció y no hubo hallazgo de cuerpo" },
      { id: "C", label: "Se fugó voluntariamente a otra provincia" },
      { id: "D", label: "Fue detenida por un delito" },
    ],
  },
  {
    id: "B2",
    text: "¿Dónde se la ubica por última vez en el relato institucional?",
    choices: [
      { id: "A", label: "En el bar" },
      { id: "B", label: "En el café" },
      { id: "C", label: "En el colegio/entorno escolar" },
      { id: "D", label: "En la estación de tren" },
    ],
  },
  {
    id: "B3",
    text: "¿Qué rol general se sugiere que tuvo el colegio?",
    choices: [
      { id: "A", label: "Ayuda total y transparente" },
      { id: "B", label: "Encubrimiento / “mirar para otro lado”" },
      { id: "C", label: "Investigación propia impecable" },
      { id: "D", label: "Denuncia inmediata con pruebas irrefutables" },
    ],
  },
  {
    id: "B4",
    text: "¿Qué elemento hace que el padre quede “marcado” ante terceros?",
    choices: [
      { id: "A", label: "Un premio laboral" },
      { id: "B", label: "Su actitud insistente/agresiva en comunicaciones" },
      { id: "C", label: "Que se mudó al exterior" },
      { id: "D", label: "Que era amigo del gerente" },
    ],
  },
  {
    id: "B5",
    text: "¿Qué dato del padre es relevante para el tipo de investigación que hace?",
    choices: [
      { id: "A", label: "Era médico" },
      { id: "B", label: "Era contador" },
      { id: "C", label: "Era profesor" },
      { id: "D", label: "Era policía" },
    ],
  },
  {
    id: "B6",
    text: "¿Qué tipo de material aparece asociado a la búsqueda de Sofía en tu set de archivos iniciales?",
    choices: [
      { id: "A", label: "Recorte de diario de búsqueda" },
      { id: "B", label: "Informe balístico firmado" },
      { id: "C", label: "Acta de defunción" },
      { id: "D", label: "Carta manuscrita de Sofía" },
    ],
  },

  // Bloque D — Casa de Eduardo / board / ticket
  {
    id: "D1",
    text: "¿Qué tipo de cosas conecta el board?",
    choices: [
      { id: "A", label: "Recetas de cocina" },
      { id: "B", label: "Personas + lugares + casos" },
      { id: "C", label: "Solo números de lotería" },
      { id: "D", label: "Solo fotos de Sofía" },
    ],
  },
  {
    id: "D2",
    text: "¿Qué sugiere el ticket de farmacia?",
    choices: [
      { id: "A", label: "Que Eduardo estaba de paseo" },
      { id: "B", label: "Que compró vitaminas por deporte" },
      { id: "C", label: "Que estaba mal (ansiolíticos/analgésicos) poco después del ataque" },
      { id: "D", label: "Que Héctor compró medicación" },
    ],
  },
  {
    id: "D3",
    text: "¿Por qué el ticket importa dentro de la línea temporal?",
    choices: [
      { id: "A", label: "Prueba que el colegio mintió" },
      { id: "B", label: "Ubica a Eduardo activo después del disparo" },
      { id: "C", label: "Identifica al gerente Lagos" },
      { id: "D", label: "Prueba que la mujer del río vivía en Beatriz" },
    ],
  },
  {
    id: "D4",
    text: "¿Qué representa el board, en términos de estado mental?",
    choices: [
      { id: "A", label: "Un hobby decorativo" },
      { id: "B", label: "Un trabajo sistemático/obsesivo de conexión de pistas" },
      { id: "C", label: "Un trabajo policial oficial" },
      { id: "D", label: "Un proyecto escolar" },
    ],
  },
  {
    id: "D5",
    text: "¿Qué tipo de evidencia suele acompañar este tipo de board?",
    choices: [
      { id: "A", label: "Recortes, fotos, notas, flechas/conexiones" },
      { id: "B", label: "Planos de construcción oficiales" },
      { id: "C", label: "Contratos de alquiler" },
      { id: "D", label: "Menús de restaurantes" },
    ],
  },
  {
    id: "D6",
    text: "¿Qué idea instala el board sobre el caso?",
    choices: [
      { id: "A", label: "Fue un hecho aislado sin conexiones" },
      { id: "B", label: "Hay una red/patrón de casos y actores" },
      { id: "C", label: "Todo fue un malentendido" },
      { id: "D", label: "Héctor inventó todo" },
    ],
  },

  // Bloque E — Investigación de Héctor
  {
    id: "E1",
    text: "¿Cuál fue la versión oficial sobre la mujer del río?",
    choices: [
      { id: "A", label: "Homicidio confirmado" },
      { id: "B", label: "Accidente/ahogamiento con drogas no letales" },
      { id: "C", label: "Suicidio por arma de fuego" },
      { id: "D", label: "Desaparición sin cuerpo" },
    ],
  },
  {
    id: "E2",
    text: "¿Por qué Héctor no compra esa versión?",
    choices: [
      { id: "A", label: "Porque lo vio en TV" },
      { id: "B", label: "Por contradicciones + testigo + detalles que no cierran" },
      { id: "C", label: "Porque el padre se lo dijo" },
      { id: "D", label: "Porque el gerente lo confesó" },
    ],
  },
  {
    id: "E3",
    text: "¿Qué rol cumple el testigo para Héctor?",
    choices: [
      { id: "A", label: "Es el culpable" },
      { id: "B", label: "Es la pista inicial que activa la investigación" },
      { id: "C", label: "Es un policía encubierto" },
      { id: "D", label: "Es un periodista rival" },
    ],
  },
  {
    id: "E4",
    text: "¿A dónde conduce el seguimiento de la mujer tatuada?",
    choices: [
      { id: "A", label: "A la escuela" },
      { id: "B", label: "A la casa de Beatriz" },
      { id: "C", label: "Al café (punto de sobres/gerente)" },
      { id: "D", label: "A la comisaría" },
    ],
  },
  {
    id: "E5",
    text: "¿El gerente Lagos era la cabeza?",
    choices: [
      { id: "A", label: "Sí, era el líder máximo" },
      { id: "B", label: "No, era un intermediario/eslabón" },
      { id: "C", label: "Era un testigo inocente" },
      { id: "D", label: "Era el padre de Sofía" },
    ],
  },
  {
    id: "E6",
    text: "¿Cómo se conectan bar + café + escuela?",
    choices: [
      { id: "A", label: "Son lugares sin relación real" },
      { id: "B", label: "Funcionan como piezas/fachadas de la misma red" },
      { id: "C", label: "Solo comparten la zona geográfica" },
      { id: "D", label: "Los une una amistad de Héctor" },
    ],
  },

  // Bloque F — Integración + cronología
  {
    id: "F1",
    text: "¿Qué comparten Sofía y la mujer del río en el “patrón” del caso?",
    choices: [
      { id: "A", label: "Solo la ciudad" },
      { id: "B", label: "Señales de red/entorno repetido (tatuaje/sistema)" },
      { id: "C", label: "El mismo apellido" },
      { id: "D", label: "Que las dos eran policías" },
    ],
  },
  {
    id: "F2",
    text: "¿Qué papel juega Eduardo (padre) en la cadena?",
    choices: [
      { id: "A", label: "Es el creador original de la red" },
      { id: "B", label: "Es un actor reactivo que se obsesiona e irrumpe violentamente" },
      { id: "C", label: "No tiene nada que ver" },
      { id: "D", label: "Es el gerente Lagos" },
    ],
  },
  {
    id: "F3",
    text: "¿Qué evento une definitivamente la investigación del padre con la de Héctor?",
    choices: [
      { id: "A", label: "El partido de fútbol" },
      { id: "B", label: "El ataque/robo en la casa de Héctor" },
      { id: "C", label: "El divorcio" },
      { id: "D", label: "La mudanza de Beatriz" },
    ],
  },
  {
    id: "F4",
    text: "¿Quién vivía/estaba instalado en la casa de Beatriz antes del final?",
    choices: [
      { id: "A", label: "Héctor" },
      { id: "B", label: "Eduardo" },
      { id: "C", label: "Lagos" },
      { id: "D", label: "El testigo" },
    ],
  },
  {
    id: "F5",
    text: "Orden macro: ¿qué pasa primero?",
    choices: [
      { id: "A", label: "Ataque a Héctor" },
      { id: "B", label: "Desaparición de Sofía" },
      { id: "C", label: "Hallazgo de la mujer del río" },
      { id: "D", label: "Visita a Beatriz" },
    ],
  },
  {
    id: "F6",
    text: "Orden macro: ¿qué pasa inmediatamente antes del ataque a Héctor (según el hilo general)?",
    choices: [
      { id: "A", label: "Hallazgo del pendrive en la Biblia" },
      { id: "B", label: "Eduardo se mueve/actúa para apropiarse de la investigación" },
      { id: "C", label: "Sofía vuelve a casa" },
      { id: "D", label: "El colegio publica un comunicado final" },
    ],
  },
];

export const QR3_QUESTIONS_PUBLIC = DEBUG ? [
   {
    id: "TEST",
    text: "Pregunta de prueba",
    choices: [
      { id: "A", label: "Correcto" },
      { id: "B", label: "Falso" },
      { id: "C", label: "Falso" },
      { id: "D", label: "Falso" },
    ],
  },
] : QUESTIONS