import React from "react";
// CartPage komponent testləri (B.2/C.1).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CartPage from "./Cart";
import type { CartItem } from "../types";

const items: CartItem[] = [
  { id: 1, name: "Şalvar", price: 30, qty: 2, store: "S", color: "Qara", imageUrls: ["x.jpg"], size: "L" },
];
// token=null → delivery quote fetch effekti atlanır (deterministik test)
const base = { nav: vi.fn(), removeFromCart: vi.fn(), updateQty: vi.fn(), user: null, token: null };

describe("CartPage", () => {
  it("boş səbət boş-vəziyyət göstərir və Kataloq düyməsi nav çağırır", () => {
    const nav = vi.fn();
    render(<CartPage {...base} nav={nav} cart={[]} />);
    expect(screen.getByText("Səbətiniz boşdur")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Kataloq"));
    expect(nav).toHaveBeenCalledWith("catalog", { category: "Hamısı" });
  });

  it("məhsulu, sətir cəmini və ümumi məbləği göstərir", () => {
    render(<CartPage {...base} cart={items} />);
    expect(screen.getByText("Şalvar")).toBeInTheDocument();
    expect(screen.getByText("60.00 ₼")).toBeInTheDocument();      // 30 × 2 sətir cəmi
    expect(screen.getByText("60.00 AZN")).toBeInTheDocument();    // xülasə məbləği
  });

  it("qty +/- updateQty çağırır, Sil removeFromCart çağırır", () => {
    const updateQty = vi.fn(); const removeFromCart = vi.fn();
    render(<CartPage {...base} cart={items} updateQty={updateQty} removeFromCart={removeFromCart} />);
    fireEvent.click(screen.getByLabelText("Artır"));
    expect(updateQty).toHaveBeenCalledWith(1, 3);
    fireEvent.click(screen.getByLabelText("Azalt"));
    expect(updateQty).toHaveBeenCalledWith(1, 1);
    fireEvent.click(screen.getByLabelText("Sil"));
    expect(removeFromCart).toHaveBeenCalledWith(1);
  });

  it("checkout düyməsi nav('checkout') çağırır", () => {
    const nav = vi.fn();
    render(<CartPage {...base} nav={nav} cart={items} />);
    fireEvent.click(screen.getByText(/Sifarişi rəsmiləşdir/));
    expect(nav).toHaveBeenCalledWith("checkout");
  });
});
