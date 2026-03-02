import * as React from "react"

export interface SliderProps {
  min: number
  max: number
  value: number[]
  onValueChange: (value: number[]) => void
}

export function Slider({ min, max, value, onValueChange }: SliderProps) {
  const handleChange = (index: number, newValue: number) => {
    const newValues = [...value]
    newValues[index] = newValue
    onValueChange(newValues)
  }

  return (
    <div style={{ position: "relative", width: "100%", padding: "1rem 0" }}>
      <div style={{ 
        position: "relative", 
        height: "4px", 
        backgroundColor: "hsl(var(--muted))",
        borderRadius: "2px"
      }}>
        <div style={{
          position: "absolute",
          height: "4px",
          backgroundColor: "hsl(var(--primary))",
          left: `${((value[0] - min) / (max - min)) * 100}%`,
          right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          borderRadius: "2px"
        }} />
        
        {value.map((val, index) => (
          <input
            key={index}
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={(e) => handleChange(index, parseInt(e.target.value))}
            style={{
              position: "absolute",
              width: "100%",
              height: "4px",
              top: "-10px",
              left: 0,
              opacity: 0,
              cursor: "pointer",
              pointerEvents: "all"
            }}
          />
        ))}
        
        {value.map((val, index) => (
          <div
            key={`thumb-${index}`}
            style={{
              position: "absolute",
              width: "20px",
              height: "20px",
              backgroundColor: "hsl(var(--primary))",
              borderRadius: "50%",
              top: "50%",
              left: `${((val - min) / (max - min)) * 100}%`,
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}
          />
        ))}
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
        <span>{value[0]}</span>
        <span>{value[1]}</span>
      </div>
    </div>
  )
}
