import { Compass, Bot, BookOpenText, LineChart, GraduationCap, ShieldCheck, Workflow } from 'lucide-react'

// Edita aquí el contenido real (servicios, correo de contacto, etc.)
export const CONTACT_EMAIL = 'hola@tudominio.com'

export const SERVICES = [
  {
    icon: Compass,
    title: 'Diagnóstico y estrategia de IA',
    desc: 'Mapeamos tus procesos, medimos dónde la IA genera retorno real y priorizamos un plan de 90 días.',
  },
  {
    icon: Bot,
    title: 'Agentes de IA y automatización',
    desc: 'Agentes que ejecutan tareas de punta a punta: atención al cliente, ventas, back-office y reportes.',
  },
  {
    icon: BookOpenText,
    title: 'Asistentes con tu conocimiento',
    desc: 'Un cerebro sobre tus documentos, políticas y datos, con fuentes citadas y permisos por rol.',
  },
  {
    icon: LineChart,
    title: 'Analítica y modelos predictivos',
    desc: 'De datos dispersos a decisiones: tableros, predicción de demanda y detección de anomalías.',
  },
  {
    icon: GraduationCap,
    title: 'Formación y adopción',
    desc: 'Talleres y acompañamiento para que tu equipo trabaje con la IA, no contra ella.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad y gobernanza de IA',
    desc: 'Control de accesos, protección de datos y evaluación de riesgos desde el diseño.',
  },
]

export const STEPS = [
  { n: '01', title: 'Descubrir', desc: 'Entendemos tu operación, tus cuellos de botella y qué vale la pena automatizar.' },
  { n: '02', title: 'Diseñar', desc: 'Definimos el agente, sus herramientas, sus límites y dónde interviene una persona.' },
  { n: '03', title: 'Desplegar', desc: 'Lo construimos, lo conectamos a tus sistemas y lo probamos con casos reales.' },
  { n: '04', title: 'Medir y escalar', desc: 'Medimos tiempo ahorrado, calidad y costo; luego replicamos lo que funciona.' },
]

export const CATEGORIES = [
  {
    id: 'automatizar',
    label: 'Automatizar',
    icon: Workflow,
    prompts: [
      '¿Qué procesos de mi empresa puedo automatizar primero con agentes de IA?',
      'Quiero automatizar la atención al cliente: ¿por dónde empiezo?',
      '¿Cómo automatizo la generación de reportes semanales?',
      '¿Qué tareas de ventas puede ejecutar un agente de IA?',
    ],
  },
  {
    id: 'aprender',
    label: 'Aprender',
    icon: GraduationCap,
    prompts: [
      '¿Cuál es la diferencia entre un chatbot y un agente de IA?',
      '¿Qué es RAG y cuándo me conviene usarlo?',
      'Explícame qué es un flujo agéntico con un ejemplo real',
      '¿Qué necesito para construir mi primer agente de IA?',
    ],
  },
  {
    id: 'roi',
    label: 'Medir ROI',
    icon: LineChart,
    prompts: [
      '¿Cómo calculo el ROI de automatizar un proceso con IA?',
      '¿Qué métricas debo seguir para saber si un agente funciona?',
      '¿Cuánto cuesta realmente operar un agente de IA?',
      '¿Cómo priorizo qué automatizar primero?',
    ],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: ShieldCheck,
    prompts: [
      '¿Qué riesgos de seguridad tienen los agentes de IA?',
      '¿Cómo protejo datos sensibles al usar IA en mi empresa?',
      '¿Qué es la inyección de prompts y cómo me defiendo?',
      '¿Cómo hago que una persona supervise a un agente?',
    ],
  },
]
