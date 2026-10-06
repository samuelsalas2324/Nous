import { Compass, Bot, BookOpenText, LineChart, GraduationCap, ShieldCheck, Workflow, Target, MessageCircle, CalendarCheck, Handshake, FileText, Repeat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Edita aquí el contenido real (servicios, correo de contacto, etc.)
export const CONTACT_EMAIL = 'hola@tudominio.com'

// Número de WhatsApp comercial en formato internacional, sin "+" (opcional). Si falta, el CTA usa el correo.
export const WHATSAPP_NUMBER: string = import.meta.env.VITE_WHATSAPP_NUMBER || ''
export const PRIVACY_URL: string = import.meta.env.VITE_PRIVACY_URL || ''
export const DEFAULT_COUNTRY_CODE: string = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '57'

export interface SalesAgent {
  /** Debe coincidir con AGENTS en api/chat.js y con validAgent() en firestore.rules. */
  id: string
  name: string
  role: string
  desc: string
  icon: LucideIcon
  channels: string[]
  starters: string[]
}

export const DEFAULT_AGENT = 'calificador'

// Catálogo de agentes de ventas que el prospecto puede probar durante su demo.
export const SALES_AGENTS: SalesAgent[] = [
  {
    id: 'calificador',
    name: 'Calificador de prospectos',
    role: 'Prioriza quién merece tu tiempo',
    desc: 'Puntúa cada contacto entrante según presupuesto, necesidad y urgencia, y te dice a quién llamar primero.',
    icon: Target,
    channels: ['Web', 'CRM'],
    starters: ['Vendo servicios B2B y recibo 40 contactos a la semana. ¿Cómo los calificarías?', 'Muéstrame preguntas de calificación para mi negocio'],
  },
  {
    id: 'seguimiento',
    name: 'Seguimiento 24/7',
    role: 'Nadie se queda sin respuesta',
    desc: 'Redacta y programa seguimientos por WhatsApp y correo hasta obtener respuesta, con el tono de tu marca.',
    icon: MessageCircle,
    channels: ['WhatsApp', 'Correo'],
    starters: ['Cotizé a un cliente hace 5 días y no responde. ¿Qué le escribo?', 'Diséñame una secuencia de 4 seguimientos'],
  },
  {
    id: 'agendador',
    name: 'Agendador de reuniones',
    role: 'De la conversación a la cita',
    desc: 'Propone horarios, confirma, reprograma y recuerda la cita para que menos prospectos se pierdan en el camino.',
    icon: CalendarCheck,
    channels: ['WhatsApp', 'Calendario'],
    starters: ['Quiero que mis prospectos agenden una llamada de 20 minutos solos', 'Redacta el mensaje para confirmar y recordar una cita'],
  },
  {
    id: 'objeciones',
    name: 'Manejo de objeciones',
    role: 'Responde al "está caro" y al "lo pienso"',
    desc: 'Prepara respuestas para las objeciones más comunes de tu sector y te entrena para usarlas en la conversación.',
    icon: Handshake,
    channels: ['Web', 'WhatsApp'],
    starters: ['Mis clientes dicen "está muy caro". ¿Cómo respondo?', 'Hagamos un simulacro de objeciones para mi producto'],
  },
  {
    id: 'propuestas',
    name: 'Propuestas comerciales',
    role: 'Propuestas claras en minutos',
    desc: 'Convierte la conversación con el cliente en una propuesta ordenada: alcance, beneficios, inversión y siguientes pasos.',
    icon: FileText,
    channels: ['Correo', 'CRM'],
    starters: ['Arma la estructura de una propuesta para un cliente de mi sector', '¿Qué debe incluir una propuesta que cierre?'],
  },
  {
    id: 'reactivador',
    name: 'Reactivación de clientes',
    role: 'Recupera oportunidades dormidas',
    desc: 'Detecta clientes y cotizaciones inactivas y les escribe en el momento justo para retomar la conversación.',
    icon: Repeat,
    channels: ['WhatsApp', 'Correo'],
    starters: ['Tengo clientes que no compran hace 6 meses. ¿Cómo los reactivo?', 'Redacta un mensaje de reactivación que no suene a insistencia'],
  },
]

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
