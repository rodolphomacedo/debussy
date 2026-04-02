import { render } from '@testing-library/react'
import { EarMusicIcon } from './EarMusicIcon'

describe('EarMusicIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<EarMusicIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('accepts a custom size', () => {
    const { container } = render(<EarMusicIcon size={48} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('48')
    expect(svg.getAttribute('height')).toBe('48')
  })

  it('accepts a className prop', () => {
    const { container } = render(<EarMusicIcon className="test-class" />)
    const svg = container.querySelector('svg')!
    expect(svg.classList.contains('test-class')).toBe(true)
  })
})
