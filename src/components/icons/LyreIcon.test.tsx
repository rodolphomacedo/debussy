import { render } from '@testing-library/react'
import { LyreIcon } from './LyreIcon'

describe('LyreIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<LyreIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts a custom size', () => {
    const { container } = render(<LyreIcon size={32} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('height')).toBe('32')
  })

  it('accepts a style prop', () => {
    const { container } = render(<LyreIcon style={{ color: 'red' }} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.color).toBe('red')
  })

  it('accepts a className prop', () => {
    const { container } = render(<LyreIcon className="custom-class" />)
    const svg = container.querySelector('svg')!
    expect(svg.classList.contains('custom-class')).toBe(true)
  })
})
