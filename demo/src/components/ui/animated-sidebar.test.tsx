import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Sidebar, SidebarBody, SidebarLink } from "./animated-sidebar";

const SidebarFixture = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody>
        <nav aria-label="Primary navigation">
          <SidebarLink link={{ label: "Dashboard", href: "/dashboard", icon: <span aria-hidden="true">D</span> }} />
        </nav>
      </SidebarBody>
    </Sidebar>
  );
};

describe("animated sidebar", () => {
  it("renders navigation in both desktop and keyboard-operable mobile sidebars", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SidebarFixture />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    menuButton.focus();
    fireEvent.click(menuButton);

    expect(screen.getAllByRole("link", { name: "Dashboard" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Dashboard" })[0]).toHaveAttribute("aria-current", "page");
    const closeButton = screen.getByRole("button", { name: "Close navigation" });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true });
    expect(screen.getAllByRole("link", { name: "Dashboard" })[1]).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument());
    expect(menuButton).toHaveFocus();
  });

  it("expands the desktop sidebar when a navigation link receives focus", async () => {
    render(
      <MemoryRouter>
        <SidebarFixture />
      </MemoryRouter>,
    );

    const desktopLink = screen.getAllByRole("link", { name: "Dashboard" })[0];
    fireEvent.focus(desktopLink);

    await waitFor(() => expect(desktopLink.closest("div")).toHaveStyle({ width: "300px" }));
  });
});
