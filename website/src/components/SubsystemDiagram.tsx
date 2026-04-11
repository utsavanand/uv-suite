import { motion } from 'framer-motion'

const systems = [
  { id: 'index', label: 'UV Index', role: 'Understand', color: 'var(--color-uv-index)' },
  { id: 'acts', label: 'UV Acts', role: 'Build', color: 'var(--color-uv-acts)' },
  { id: 'guard', label: 'UV Guard', role: 'Harden', color: 'var(--color-uv-guard)' },
]

export function SubsystemDiagram() {
  return (
    <div className="grid grid-cols-3 gap-px bg-border-light rounded-lg overflow-hidden">
      {systems.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-surface p-6 text-center"
        >
          <div className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
            {s.role}
          </div>
          <div className="mt-1 text-lg font-semibold" style={{ color: s.color }}>
            {s.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
