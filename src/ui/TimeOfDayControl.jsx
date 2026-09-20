import { useExperienceStore } from '../store.js'

const options = [
  { id: 'dawn', label: 'Dawn' },
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
]

export default function TimeOfDayControl() {
  const timeOfDay = useExperienceStore((state) => state.timeOfDay)
  const setTimeOfDay = useExperienceStore((state) => state.setTimeOfDay)

  return (
    <fieldset className="time-control">
      <legend>Time of day · T to cycle</legend>
      <div className="time-control__options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={timeOfDay === option.id}
            onClick={() => setTimeOfDay(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
