export interface ColumnDef {
  title: string;
  count?: string;
  blocks?: (HTMLElement | null | undefined)[];
}

export function createColumns(defs: ColumnDef[]): HTMLDivElement {
  const columns = document.createElement("div");
  columns.className = "columns";

  defs.forEach((def) => {
    const col = document.createElement("section");
    col.className = "col";

    const title = document.createElement("div");
    title.className = "col-title";
    title.innerHTML = `
      ${def.title}
      ${def.count ? `<span class="col-title-count">${def.count}</span>` : ""}
    `;
    col.appendChild(title);

    (def.blocks || []).forEach((block) => {
      if (block) col.appendChild(block);
    });

    columns.appendChild(col);
  });

  return columns;
}
