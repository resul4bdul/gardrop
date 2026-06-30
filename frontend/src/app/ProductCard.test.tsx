import React from "react";
// ProductCard komponent testləri (B.2/C.1).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "./shared";
import type { Product } from "./types";

const p: Product = {
  id: 7, name: "Test Köynək", price: 49.9, oldPrice: 79.9, discount: 38,
  category: "Kişi", store: "TestMağaza", imageUrls: ["a.jpg"], rating: 4.5, reviews: 12,
};
const base = { nav: vi.fn(), favs: [] as number[], togFav: vi.fn(), addCart: vi.fn(), cart: [], user: null };

describe("ProductCard", () => {
  it("məhsul adı, mağaza, qiymət və endirim göstərir", () => {
    render(<ProductCard p={p} {...base} />);
    expect(screen.getByText("Test Köynək")).toBeInTheDocument();
    expect(screen.getByText("TestMağaza")).toBeInTheDocument();
    expect(screen.getByText("49.9 ₼")).toBeInTheDocument();
    expect(screen.getByText("-38%")).toBeInTheDocument();
  });

  it("karta klik nav('product') çağırır", () => {
    const nav = vi.fn();
    render(<ProductCard p={p} {...base} nav={nav} />);
    fireEvent.click(screen.getByText("Test Köynək"));
    expect(nav).toHaveBeenCalledWith("product", { product: p });
  });

  it("ürək düyməsi togFav(id) çağırır, karta yayılmır (stopPropagation)", () => {
    const nav = vi.fn(); const togFav = vi.fn();
    render(<ProductCard p={p} {...base} nav={nav} togFav={togFav} />);
    fireEvent.click(screen.getByRole("button"));
    expect(togFav).toHaveBeenCalledWith(7);
    expect(nav).not.toHaveBeenCalled();
  });

  it("favs id-ni saxlayırsa ürək dolu (qırmızı) render olur", () => {
    const { container } = render(<ProductCard p={p} {...base} favs={[7]} />);
    expect(container.querySelector("button")?.className).toContain("text-red-500");
  });
});
