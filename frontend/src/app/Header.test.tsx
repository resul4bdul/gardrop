import React from "react";
// Header komponent testləri (B.2/C.1).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";
import type { CartItem } from "./types";

const base = {
  cart: [] as CartItem[], favs: [] as number[], page: "home", user: null,
  products: [], removeFromCart: vi.fn(), updateQty: vi.fn(), togFav: vi.fn(),
  doLogout: vi.fn(), lang: "az", setLang: vi.fn(),
};

describe("Header", () => {
  it("logo-ya klik nav('home') çağırır", () => {
    const nav = vi.fn();
    render(<Header {...base} nav={nav} />);
    fireEvent.click(screen.getAllByText("GARDROP")[0]);
    expect(nav).toHaveBeenCalledWith("home");
  });

  it("axtarışda Enter nav('search', {query}) çağırır", () => {
    const nav = vi.fn();
    render(<Header {...base} nav={nav} />);
    const input = screen.getByPlaceholderText("Məhsul, marka və ya kateqoriya axtarın...");
    fireEvent.change(input, { target: { value: "köynək" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(nav).toHaveBeenCalledWith("search", { query: "köynək" });
  });

  it("qonaq üçün 'Daxil ol' düyməsi nav('login') çağırır", () => {
    const nav = vi.fn();
    render(<Header {...base} nav={nav} />);
    fireEvent.click(screen.getByText("Daxil ol"));
    expect(nav).toHaveBeenCalledWith("login");
  });

  it("səbət/seçilmiş sayğacları doğru göstərir", () => {
    render(<Header {...base} favs={[1, 2, 3]} cart={[{ id: 1, name: "x", price: 5 }]} />);
    expect(screen.getByText("3")).toBeInTheDocument();  // fav badge
    expect(screen.getByText("1")).toBeInTheDocument();  // cart badge
  });
});
