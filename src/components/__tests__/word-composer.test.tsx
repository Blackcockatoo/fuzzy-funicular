import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { WordComposer } from "@/components/WordComposer"

function runeElements() {
  return screen.queryAllByRole("img", { name: /Rune / })
}

function runeLabels() {
  return runeElements()
    .map((element) => element.getAttribute("aria-label"))
    .filter((label): label is string => Boolean(label))
}

describe("WordComposer", () => {
  it("renders runes for text input and calculates totals", async () => {
    render(<WordComposer />)
    const input = screen.getByLabelText(/Script input/i)
    await userEvent.clear(input)
    await userEvent.type(input, "AB")
    expect(screen.getByText(/Total Gematria/i)).toHaveTextContent("3")
    const labels = runeLabels()
    expect(labels).toContain("Rune A")
    expect(labels).toContain("Rune B")
  })

  it("wraps with square binder and breaks correctly", async () => {
    render(<WordComposer />)
    const input = screen.getByLabelText(/Script input/i)
    await userEvent.clear(input)
    await userEvent.type(input, "AB")

    const squareToggle = screen.getByLabelText(/Set frame Square/i)
    await userEvent.click(squareToggle)
    expect(runeLabels()).toContain("Rune ⟦")
    expect(runeLabels()).toContain("Rune ⟧")

    const breakButton = screen.getByRole("button", { name: /Break/i })
    await userEvent.click(breakButton)
    expect(runeLabels()).not.toContain("Rune ⟦")
  })
})
