// frases.js
// Colección de citas sobre libros, lectura y el arte de escribir.
// Organizadas por autor. 
// Para añadir más, solo agrega un objeto { texto, autor }.
// El array FRASES se carga en app.js para mostrar la "frase del día".

const FRASES = [

  // STEPHEN KING
  { texto: "Si no tienes tiempo para leer, no tienes tiempo, ni las herramientas para escribir. Así de simple.", autor: "Stephen King" },
  { texto: "Si quieres ser escritor, debes hacer dos cosas sobre las demás: leer mucho y escribir mucho. No conozco ningún atajo.", autor: "Stephen King" },
  { texto: "Leer es el centro creativo de la vida de un escritor. El truco consiste en aprender a leer tanto a pequeños sorbos como a grandes tragos.", autor: "Stephen King" },
  { texto: "Cuando escribes, estás contándote una historia. Cuando reescribes con otro objetivo, lo que comenzó siendo para ti termina por apagarse.", autor: "Stephen King" },
  { texto: "Los adverbios son enemigos del escritor. El camino al infierno está pavimentado con adverbios.", autor: "Stephen King" },
  { texto: "No utilices la voz pasiva. Los escritores tímidos ocupan la voz pasiva por la misma razón que los amantes tímidos prefieren parejas pasivas.", autor: "Stephen King" },
  { texto: "El objetivo de la ficción no es la perfección gramatical, sino contar una historia.", autor: "Stephen King" },
  { texto: "Cuando tu historia esté lista para reescribir, córtala hasta el hueso. Deshazte de cada onza de grasa sobrante. Va a doler, pero debe hacerse.", autor: "Stephen King" },
  { texto: "Los buenos libros no dan todos sus secretos en una sola vez.", autor: "Stephen King" },
  { texto: "La ficción es la verdad dentro de la mentira.", autor: "Stephen King" },
  { texto: "Los monstruos son reales y los fantasmas también lo son. Viven dentro de nosotros y a veces ganan.", autor: "Stephen King" },
  { texto: "Los libros son el entretenimiento perfecto: sin comerciales, sin baterías, horas de diversión por cada dólar gastado.", autor: "Stephen King" },
  { texto: "Los libros son magia única y portátil.", autor: "Stephen King" },
  { texto: "Los aficionados se sientan a esperar la inspiración; los demás nos levantamos y nos ponemos a trabajar.", autor: "Stephen King" },
  { texto: "El momento más aterrador es siempre justo antes de empezar.", autor: "Stephen King" },
  { texto: "Escribir es humano; editar es divino.", autor: "Stephen King" },
  { texto: "Se escribe una palabra a la vez. Se trata de un cuento de una sola página o de una trilogía épica: el éxito siempre se logra con una palabra a la vez.", autor: "Stephen King" },
  { texto: "La imaginación tiene que ser musculosa, lo que significa que debe ejercitarse de manera disciplinada, día tras día, escribiendo, fallando, teniendo éxito y revisando.", autor: "Stephen King" },
  { texto: "Hacer que la gente crea lo increíble no es un truco; es trabajo. La creencia y la absorción del lector vienen en los detalles.", autor: "Stephen King" },
  { texto: "La lectura es el centro creativo de la vida de un escritor.", autor: "Stephen King" },


  // NEIL GAIMAN
  { texto: "Un libro es un sueño que tienes en tus manos.", autor: "Neil Gaiman" },
  { texto: "Viví en los libros más de lo que viví en cualquier otro lugar.", autor: "Neil Gaiman" },
  { texto: "Leer ficción, leer por placer, es una de las cosas más importantes que uno puede hacer.", autor: "Neil Gaiman" },
  { texto: "La ficción tiene dos usos. Primero, es una puerta de entrada a la lectura.", autor: "Neil Gaiman" },
  { texto: "Las bibliotecas son importantes. Voy a hacer una apasionada defensa de que las bibliotecas y los bibliotecarios existan y sean preservados.", autor: "Neil Gaiman" },
  { texto: "Los cuentos de hadas superan la realidad no porque nos digan que los dragones existen, sino porque nos dicen que pueden ser vencidos.", autor: "Neil Gaiman" },
  { texto: "Google puede darte 100.000 respuestas. Un bibliotecario puede darte la correcta.", autor: "Neil Gaiman" },
  { texto: "La imaginación es un músculo. Si no se ejercita, se atrofia.", autor: "Neil Gaiman" },
  { texto: "Las palabras significan lo que nosotros queramos.", autor: "Neil Gaiman" },
  { texto: "La clave no es aprender de los niños, sino no olvidar que lo fuimos.", autor: "Neil Gaiman" },
  { texto: "Toda historia tiene un final feliz, solo hay que saber cuándo hay que parar de contarla.", autor: "Neil Gaiman" },
  { texto: "Comete errores interesantes, comete errores increíbles, comete errores gloriosos y estupendos. Rompe las reglas.", autor: "Neil Gaiman" },
  { texto: "Haz las cosas que solo tú puedes hacer. La única cosa que tú tienes, y que nadie más tiene, eres tú.", autor: "Neil Gaiman" },
  { texto: "Tienes lo mismo que todo el mundo: toda una vida.", autor: "Neil Gaiman" },
  { texto: "Cuando tienes miedo, pero lo haces de todas formas, eso es valentía.", autor: "Neil Gaiman" },
  { texto: "Nos debemos el uno al otro contar historias.", autor: "Neil Gaiman" },
  { texto: "Los libros son la forma en que los muertos se comunican con nosotros.", autor: "Neil Gaiman" },
  { texto: "Un libro físico es como un tiburón. Los tiburones son antiguos: había tiburones en el océano antes que los dinosaurios. Y la razón por la que todavía hay tiburones es que son mejores siendo tiburones que cualquier otra cosa.", autor: "Neil Gaiman" },


  // GEORGE R.R. MARTIN
  { texto: "Un lector vive mil vidas antes de morir. Aquel que nunca lee vive solo una.", autor: "George R.R. Martin" },
  { texto: "Lo más importante para cualquier aspirante a escritor, creo, es leer. Leer es tu superpoder.", autor: "George R.R. Martin" },
  { texto: "Necesitas leerlo todo. Cada escritor tiene algo que enseñarte, para bien o para mal.", autor: "George R.R. Martin" },
  { texto: "Escribe todos los días, aunque sea solo una página o dos. Cuanto más escribas, mejor te volverás.", autor: "George R.R. Martin" },
  { texto: "Cada escritor necesita aprender a crear sus propios personajes, mundos y escenarios. Usar el mundo de otro es el camino fácil.", autor: "George R.R. Martin" },
  { texto: "Una mente necesita libros como una espada necesita una piedra de afilar, si quiere mantener su filo.", autor: "George R.R. Martin" },
  { texto: "La mejor fantasía está escrita en el lenguaje de los sueños. Es vívida como son los sueños, más real que lo real.", autor: "George R.R. Martin" },
  { texto: "Algunos escritores disfrutan escribiendo, me han dicho. Yo no. Yo disfruto haber escrito.", autor: "George R.R. Martin" },
  { texto: "Los cuentos cortos son un buen lugar para que cometas los errores que todo escritor principiante va a cometer.", autor: "George R.R. Martin" },


  // DAVID BALDACCI
  { texto: "La autocorrección continúa hasta el día de hoy. No cada palabra que escribo va a quedar grabada en piedra. Algunos días soy mejor que otros, y algunos días requieren más edición cuando vuelvo a mirar lo que he escrito.", autor: "David Baldacci" },
  { texto: "Muchos escritores establecen metas diarias: escribir tantas palabras o páginas, o durante tantas horas. Yo no. Si estableces la meta en 1.000 palabras, algunos días vas a escribir 1.000 palabras de basura.", autor: "David Baldacci" },
  { texto: "Los escritores que están destinados a ser escritores lo serán porque existe ese impulso interno que no te permite detenerte.", autor: "David Baldacci" },
  { texto: "Creo que los escritores tienen que ser grandes observadores. Los buenos escritores son observadores.", autor: "David Baldacci" },
  { texto: "En cuanto crees que sabes lo que estás haciendo como escritor, más vale que lo dejes, porque has perdido tu ventaja.", autor: "David Baldacci" },
  { texto: "Escribo sobre algo que me gustaría saber más, pero que no sé.", autor: "David Baldacci" },
  { texto: "No importa lo que esté haciendo, dónde esté, siempre estoy escribiendo, siempre pensando, investigando, viviendo para que mis historias tengan vida.", autor: "David Baldacci" },
  { texto: "La escritura, para mí, no es un trabajo; es un estilo de vida. Así que lo trato como tal. No siempre estoy en la oficina, pero nunca he terminado.", autor: "David Baldacci" },


  // RICHARD DAWKINS
  { texto: "Los libros no son solo un pisapapeles. Aportan una vida.", autor: "Richard Dawkins" },
  { texto: "La teoría de la evolución por selección natural acumulativa es la única teoría que conocemos que es, en principio, capaz de explicar la existencia de complejidad organizada.", autor: "Richard Dawkins" },
  { texto: "La selección natural no eliminará la ignorancia de las generaciones futuras.", autor: "Richard Dawkins" },
  { texto: "Cuanto menos piensas, más crees.", autor: "Richard Dawkins" },
  { texto: "Hay algo infantil en la presunción de que alguien más tiene la responsabilidad de darle sentido y rumbo a tu vida. La visión verdaderamente adulta, por el contrario, es que nuestra vida es significativa.", autor: "Richard Dawkins" },
  { texto: "No hay un mal modo de averiguar qué hay en un libro: es leerlo. Así que ve a por él.", autor: "Richard Dawkins" },


  // JOHN VERDON
  { texto: "Escribir libros es como buscar la verdad; la publicidad no tiene nada que ver con la verdad. Creo que esa es la gran diferencia entre ambos trabajos.", autor: "John Verdon" },
  { texto: "Lo que viene del corazón llega al corazón. Y ayuda saber a quién le estás hablando.", autor: "John Verdon" },
  { texto: "Una vez que lo empiezas, termínalo.", autor: "John Verdon" },
  { texto: "La escritura en sí misma, para mí, es un placer, una actividad que me gusta y siempre me ha gustado.", autor: "John Verdon" },
  { texto: "La mente es una masa de contradicciones y conflictos. Mentimos para conseguir que otros confíen en nosotros. Escondemos nuestro verdadero ser en una persecución de la intimidad.", autor: "John Verdon" },
  { texto: "Creemos algunas cosas porque sentimos miedo o nos sentimos culpables. Y creemos aquello que nos conviene creer, aquello que nos hace sentir seguros.", autor: "John Verdon" },


  // CARL SAGAN
  { texto: "Leer es viajar en el tiempo.", autor: "Carl Sagan" },
  { texto: "Un libro es prueba de que los humanos son capaces de hacer magia.", autor: "Carl Sagan" },
  { texto: "Los libros rompen las cadenas del tiempo.", autor: "Carl Sagan" },
  { texto: "Los libros, comprables a bajo costo, nos permiten interrogar el pasado con alta precisión, aprovechar la sabiduría de nuestra especie.", autor: "Carl Sagan" },
  { texto: "Los libros son clave para entender el mundo y participar en una sociedad democrática.", autor: "Carl Sagan" },
  { texto: "Los libros permiten viajar en el tiempo, aprovechar la sabiduría de nuestros ancestros.", autor: "Carl Sagan" },
  { texto: "Un vistazo a un libro y escuchas la voz de otra persona, quizás alguien muerto hace 1.000 años. Leer es viajar en el tiempo.", autor: "Carl Sagan" },
  { texto: "Los libros son como semillas.", autor: "Carl Sagan" },


  // JULIO CORTÁZAR
  { texto: "Cuando uno quiere escribir, escribe. Si uno está condenado a escribir, escribe. La literatura es una forma de juego por el que uno puede llegar a jugarse la vida.", autor: "Julio Cortázar" },
  { texto: "Entre nosotros escribir y leer es cada vez más una posibilidad de actuar extraliterariamente, aunque la mayoría de nuestros libros más significativos no contengan mensajes expresos.", autor: "Julio Cortázar" },
  { texto: "Nadie puede pretender que los cuentos sólo deban escribirse luego de conocer sus leyes… no hay tales leyes; a lo sumo cabe hablar de puntos de vista, de ciertas constantes que dan una estructura a ese género tan poco encasillable.", autor: "Julio Cortázar" },
  { texto: "El cuento es una síntesis viviente a la vez que una vida sintetizada, algo así como un temblor de agua dentro de un cristal, una fugacidad en una permanencia.", autor: "Julio Cortázar" },
  { texto: "Un buen cuento es incisivo, mordiente, sin cuartel desde las primeras frases.", autor: "Julio Cortázar" },
  { texto: "Un cuento es significativo cuando quiebra sus propios límites con esa explosión de energía espiritual que ilumina bruscamente algo que va mucho más allá de la pequeña y a veces miserable anécdota que cuenta.", autor: "Julio Cortázar" },
  { texto: "No hay otra manera de que un cuento sea eficaz, haga blanco en el lector y se clave en su memoria.", autor: "Julio Cortázar" },
  { texto: "Hay jirones, impulsos, bloques, y todo busca una forma, entonces entra en juego el ritmo y yo escribo dentro de ese ritmo, escribo por él, movido por él.", autor: "Julio Cortázar" },
  { texto: "El verdadero y único personaje que me interesa es el lector, en la medida en que algo de lo que escribo debería contribuir a mutarlo.", autor: "Julio Cortázar" },
  { texto: "La fantasía es el arma más poderosa de un escritor y la que le abre las puertas de una realidad más vasta.", autor: "Julio Cortázar" },
  { texto: "Escribir para lectores sin calificarlos. Una novela es un problema; el cuento no lo es nunca.", autor: "Julio Cortázar" },


  // GABRIEL GARCÍA MÁRQUEZ
  { texto: "Cuando quiero escribir algo es porque siento que eso merece ser contado. Más aún, cuando escribo un cuento es porque a mí me gustaría leerlo.", autor: "Gabriel García Márquez" },
  { texto: "La literatura no se aprende en la universidad, sino leyendo y leyendo a los otros escritores.", autor: "Gabriel García Márquez" },
  { texto: "Salvo que sea un genio excepcional que aparezca de pronto, no se puede hacer buena literatura si no se conoce toda la literatura. Hay una tendencia a menospreciar la cultura literaria, a creer en el espontaneísmo. La verdad es que la literatura es una ciencia que hay que aprender.", autor: "Gabriel García Márquez" },
  { texto: "Si bien la literatura es un producto social, el trabajo literario es absolutamente individual y es, además, el trabajo más solitario del mundo. Nadie te puede ayudar a escribir lo que estás escribiendo.", autor: "Gabriel García Márquez" },
  { texto: "Una página en blanco es como un ring de boxeo, en el cual uno se cae a golpes con las palabras.", autor: "Gabriel García Márquez" },
  { texto: "Los libros hay que desatornillarlos y desbaratarlos, a fin de desentrañar lo que llevan por dentro.", autor: "Gabriel García Márquez" },
  { texto: "El deber revolucionario de un escritor es escribir bien.", autor: "Gabriel García Márquez" },
  { texto: "El primer párrafo de una novela, cuento etc., es el más importante. Un buen truco es escribir el principio y el final; después se rellena.", autor: "Gabriel García Márquez" },
  { texto: "Hay que ser valientes para romper un cuento si éste no fragua desde el principio. Es más saludable empezarlo de nuevo por otro camino o tirarlo a la basura.", autor: "Gabriel García Márquez" },
  { texto: "El esfuerzo de escribir un cuento corto es tan intenso como empezar una novela. En el primer párrafo de una novela hay que definirlo todo: estructura, tono, estilo, ritmo, longitud.", autor: "Gabriel García Márquez" },
  { texto: "Hay que ser valientes para romper un cuento si éste no fragua desde el principio.", autor: "Gabriel García Márquez" },
  { texto: "El periodismo impone la necesidad de formarse una base cultural y hace de la lectura una adicción laboral.", autor: "Gabriel García Márquez" },


  // FRANZ KAFKA
  { texto: "Pienso que sólo debemos leer libros de los que muerden y pinchan. Si el libro que estamos leyendo no nos obliga a despertarnos como un puñetazo en la cara, ¿para qué molestarnos en leerlo?", autor: "Franz Kafka" },
  { texto: "Un libro debe ser el hacha que rompa el mar helado dentro de nosotros.", autor: "Franz Kafka" },
  { texto: "Un libro ha de ser un hacha para clavarla en el mar congelado que hay dentro de nosotros.", autor: "Franz Kafka" },
  { texto: "Necesitamos libros que surtan sobre nosotros el efecto de una desgracia muy dolorosa, como la muerte de alguien al que queríamos más que a nosotros.", autor: "Franz Kafka" },
  { texto: "El arte tiene más necesidad de la artesanía, que la artesanía del arte.", autor: "Franz Kafka" },
  { texto: "Escribir es una forma de oración.", autor: "Franz Kafka" },
  { texto: "Escribir cartas significa desnudarse ante los fantasmas, que lo esperan ávidamente.", autor: "Franz Kafka" },
  { texto: "Es bueno que la conciencia reciba amplias heridas, puesto que así se vuelve más sensible a cada mordedura.", autor: "Franz Kafka" },
  { texto: "La literatura es un juez perverso que decide quién se queda y quién se va, qué frase sirve y cuál no.", autor: "Franz Kafka" },
  { texto: "Yo estaba rígido y frío, era un puente tendido sobre un abismo.", autor: "Franz Kafka" },


  // H.P. LOVECRAFT
  // --- Sobre la lectura y la escritura ---
  { texto: "Todos los intentos de ganar pulido literario deben comenzar con una lectura juiciosa, y el aprendiz nunca debe dejar de mantener esta fase en lo más alto.", autor: "H.P. Lovecraft" },
  { texto: "Ningún aspirante a autor debería contentarse con una mera adquisición de reglas técnicas. Una página de Addison o de Irving enseñará más de estilo que un manual entero de reglas.", autor: "H.P. Lovecraft" },
  { texto: "No hay curso formal de escritura de ficción que pueda igualar una lectura cercana y observadora de los cuentos de Edgar Allan Poe o Ambrose Bierce.", autor: "H.P. Lovecraft" },
  { texto: "Nunca expliques nada.", autor: "H.P. Lovecraft" },
  { texto: "Los horrores, creo, deben ser originales; el uso de mitos y leyendas comunes es una influencia debilitante.", autor: "H.P. Lovecraft" },
  { texto: "No se puede ser demasiado cuidadoso en la selección de adjetivos para las descripciones.", autor: "H.P. Lovecraft" },
  { texto: "La emoción más antigua y más intensa de la humanidad es el miedo, y el miedo más antiguo y más intenso de los miedos es el miedo a lo desconocido.", autor: "H.P. Lovecraft" },
  { texto: "No podría vivir una semana sin una biblioteca privada; de hecho, me desprendería de todos mis muebles y dormiría en el suelo antes que dejar ir los 1.500 libros que poseo.", autor: "H.P. Lovecraft" },
  { texto: "Las mentes creativas son desiguales, y los mejores tejidos tienen sus puntos opacos.", autor: "H.P. Lovecraft" },
  // --- Consejos técnicos de "Notas sobre el arte de escribir cuentos fantásticos" ---
  { texto: "Preparar una sinopsis o escenario de acontecimientos en orden de su aparición; no en el de la narración.", autor: "H.P. Lovecraft" },
  { texto: "Escribir la historia rápidamente y con fluidez, sin ser demasiado crítico, siguiendo el orden narrativo de la sinopsis.", autor: "H.P. Lovecraft" },
  { texto: "Hacer una revisión exhaustiva, centrándose en el vocabulario, el ritmo de la prosa, la aliteración y la elección de cada palabra por su efecto preciso, como se haría en poesía.", autor: "H.P. Lovecraft" },
  { texto: "Hay que eliminar todo lo que pueda resultar superfluo: palabras, frases, párrafos y elementos o episodios enteros.", autor: "H.P. Lovecraft" },
  { texto: "Es preciso evitar los simples catálogos de sucesos increíbles, los cuales puede que no tengan, en el fondo, más significado aparte de una continua nube de color y simbolismo.", autor: "H.P. Lovecraft" },
  // --- Sobre el oficio y la visión del escritor ---
  { texto: "La razón por la cual escribo cuentos fantásticos es porque me producen una satisfacción personal y me acercan a la vaga, escurridiza, fragmentaria sensación de lo maravilloso.", autor: "H.P. Lovecraft" },
  { texto: "Uno de mis anhelos más fuertes es el de lograr la suspensión o violación momentánea de las irritantes limitaciones del tiempo, del espacio y de las leyes naturales que nos rigen.", autor: "H.P. Lovecraft" },
  { texto: "El conflicto con el tiempo es el tema más poderoso y prolífico de toda expresión humana.", autor: "H.P. Lovecraft" },
  { texto: "Siempre existirá un número determinado de personas que tenga gran curiosidad por el desconocido espacio exterior, y un deseo ardiente por escapar de la morada-prisión de lo conocido.", autor: "H.P. Lovecraft" },


  // CLÁSICOS DE LA LITERATURA
  { texto: "La diferencia entre la palabra casi correcta y la palabra correcta es la diferencia entre la luciérnaga y el relámpago.", autor: "Mark Twain" },
  { texto: "En cuanto al adjetivo: cuando dudes, táchalo.", autor: "Mark Twain" },
  { texto: "La manera moderna y la mejor de escribir inglés es usar un lenguaje llano y sencillo, palabras cortas y frases breves.", autor: "Mark Twain" },
  { texto: "Escribir es fácil. Todo lo que tienes que hacer es tachar las palabras equivocadas.", autor: "Mark Twain" },
  { texto: "Si uno no puede disfrutar leyendo un libro una y otra vez, no sirve de nada leerlo en absoluto.", autor: "Oscar Wilde" },
  { texto: "No existe el libro moral o inmoral. Los libros están bien escritos o mal escritos. Eso es todo.", autor: "Oscar Wilde" },
  { texto: "Puse todo mi genio en mi vida; solo puse mi talento en mis obras.", autor: "Oscar Wilde" },
  { texto: "Un escritor es alguien que ha enseñado a su mente a portarse mal.", autor: "Oscar Wilde" },
  { texto: "Estuve trabajando en la prueba de uno de mis poemas toda la mañana, y quité una coma. Por la tarde la volví a poner.", autor: "Oscar Wilde" },
  { texto: "Escribimos, no con los dedos, sino con toda la persona. El nervio que controla la pluma se enreda en cada fibra de nuestro ser, atraviesa el corazón, perfora el hígado.", autor: "Virginia Woolf" },
  { texto: "Mientras escribas lo que deseas escribir, eso es lo único que importa.", autor: "Virginia Woolf" },
  { texto: "El premio está en la escritura, no en la aprobación de los extraños.", autor: "Virginia Woolf" },
  { texto: "Cada frase debe tener en su corazón una pequeña chispa de fuego.", autor: "Virginia Woolf" },
  { texto: "Un libro no es un ser aislado: es una relación, un eje de innumerables relaciones.", autor: "Jorge Luis Borges" },
  { texto: "Siempre imaginé que el Paraíso sería algún tipo de biblioteca.", autor: "Jorge Luis Borges" },
  { texto: "Cuando tengas algo que decir, dilo; cuando no, también. Escribe siempre.", autor: "Augusto Monterroso" },
  { texto: "Lo que puedas decir con cien palabras dilo con cien palabras; lo que con una, con una. No emplees nunca el término medio.", autor: "Augusto Monterroso" },
  { texto: "Cree en ti, pero no tanto; duda de ti, pero no tanto. Cuando sientas duda, cree; cuando creas, duda.", autor: "Augusto Monterroso" },
  { texto: "La lectura hace al hombre completo; la conversación, ágil; y la escritura, exacto.", autor: "Francis Bacon" },
  { texto: "Para los que han probado la profunda actividad de la escritura, la lectura no es más que un placer secundario.", autor: "Stendhal" },
  { texto: "No existen más que dos reglas para escribir: tener algo que decir y decirlo.", autor: "Oscar Wilde" },
];