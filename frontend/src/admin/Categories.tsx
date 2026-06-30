/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Pill, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, FieldL, useLive } from "./shared";
import { MCard, MobileListState } from "../lib/iosUi";
import type { ApiFn, ToastFn, Category } from "./types";

export function Categories({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<Category[] | null>(null);
    const [edit, setEdit] = useState<Category | null>(null);
    const [del, setDel] = useState<Category | null>(null);
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<Category[]>('/api/admin/categories').then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));

    const save = async (c: Category, isNew?: boolean) => {
      try {
        if (isNew) await api('/api/admin/categories', { method: 'POST', body: JSON.stringify(c) });
        else await api('/api/admin/categories/' + encodeURIComponent(c.name), { method: 'PUT', body: JSON.stringify(c) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (c: Category) => {
      try { await api('/api/admin/categories/' + encodeURIComponent(c.name), { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };

    return (
      <div>
        <Toolbar onAdd={() => setEdit({ name: '', count: 0, subcategories: [], tree: [], _new: true })} addLabel="Kateqoriya əlavə et" />
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[600px]">
            <thead><tr className="bg-bg2"><Th>Ad</Th><Th>Məhsul sayı</Th><Th>Alt-kateqoriyalar (alt-alt sayı)</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!rows ? <TableSkeleton cols={4} /> : rows.length === 0 ? <EmptyRow cols={4} text="Kateqoriya yoxdur" /> : (
              <tbody>
                {rows.map((c) => (
                  <tr key={c.name} className="border-t border-bdr row-h">
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="text-t2" title="məhsullardan dinamik">{c.count}</Td>
                    <Td className="text-t2 max-w-[400px]"><div className="flex flex-wrap gap-1">{(c.tree && c.tree.length ? c.tree : (c.subcategories || []).map((n) => ({ name: n, children: [] }))).map((t) => <Pill key={t.name} className="bg-bg3 text-t2">{t.name}{t.children && t.children.length ? ` (${t.children.length})` : ''}</Pill>)}</div></Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setEdit({ ...c })} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setDel(c)} className="text-sale hover:underline text-sm">Sil</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Kateqoriya yoxdur" />
          {rows && rows.map((c) => {
            const subs = (c.tree && c.tree.length ? c.tree.map((t) => t.name) : (c.subcategories || []));
            return (
              <MCard key={c.name}
                title={c.name}
                subtitle={`${c.count ?? 0} məhsul`}
                rows={[['Alt-kateqoriyalar', subs.length ? subs.join(', ') : '—']]}
                actions={<>
                  <button onClick={() => setEdit({ ...c })} className="text-blue font-medium">Redaktə</button>
                  <button onClick={() => setDel(c)} className="text-sale font-medium ml-auto">Sil</button>
                </>}
              />
            );
          })}
        </div>
        {edit && <CategoryEdit cat={edit} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.name}" kateqoriyasını silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

export function CategoryEdit({ cat, onClose, onSave }: { cat: Category; onClose: () => void; onSave: (c: Category, isNew: boolean) => void }) {
    const isNew = !!cat._new;
    // Köhnə flat datanı ağaca normallaşdır. Alt-alt-kateqoriyalar redaktə zamanı XAM mətn (childrenRaw)
    // kimi saxlanılır ki, vergül/boşluq yazarkən dərhal silinməsin; massivə yalnız yadda saxlayanda çevrilir.
    type TreeRow = { name: string; childrenRaw: string };
    const initTree: TreeRow[] = (cat.tree && cat.tree.length)
      ? cat.tree.map((t) => ({ name: t.name, childrenRaw: (t.children || []).join(', ') }))
      : (cat.subcategories || []).map((n) => ({ name: n, childrenRaw: '' }));
    const [name, setName] = useState(cat.name || '');
    const [tree, setTree] = useState<TreeRow[]>(initTree);

    const parseChildren = (raw: string) => (raw || '').split(',').map((x) => x.trim()).filter(Boolean);
    const setNode = (i: number, patch: Partial<TreeRow>) => setTree(tree.map((t, j) => j === i ? { ...t, ...patch } : t));
    const addNode = () => setTree([...tree, { name: '', childrenRaw: '' }]);
    const delNode = (i: number) => setTree(tree.filter((_, j) => j !== i));

    const save = () => {
      const clean = tree.map((t) => ({ name: (t.name || '').trim(), children: parseChildren(t.childrenRaw) })).filter((t) => t.name);
      onSave({ name: name.trim(), tree: clean, subcategories: clean.map((t) => t.name) }, isNew);
    };

    return (
      <Modal title={isNew ? 'Yeni kateqoriya' : 'Kateqoriyanı redaktə et'} onClose={onClose} wide>
        <div className="space-y-4">
          <FieldL label="Əsas kateqoriya adı" req>
            <input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} disabled={!isNew} placeholder="məs: Kişi" />
          </FieldL>
          {!isNew && <p className="text-xs text-t3 -mt-2">Ad açar olduğu üçün dəyişdirilə bilməz. Məhsul sayı məhsullardan avtomatik hesablanır.</p>}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-t2">Alt-kateqoriyalar və alt-alt-kateqoriyalar</span>
              <button type="button" onClick={addNode} className="text-blue text-sm hover:underline">＋ Alt-kateqoriya</button>
            </div>
            <div className="space-y-2">
              {tree.length === 0 && <p className="text-t3 text-sm">Hələ alt-kateqoriya yoxdur.</p>}
              {tree.map((t, i) => (
                <div key={i} className="bg-bg2 rounded-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input value={t.name} onChange={(e) => setNode(i, { name: e.target.value })} placeholder="Alt-kateqoriya adı (məs: T-shirt)"
                      className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm font-medium" />
                    <button type="button" onClick={() => delNode(i)} className="text-sale text-lg px-2 leading-none">×</button>
                  </div>
                  <input value={t.childrenRaw || ''} onChange={(e) => setNode(i, { childrenRaw: e.target.value })} placeholder="Alt-alt-kateqoriyalar (vergüllə): Basic, Qısaqol, Uzunqol"
                    className="w-full bg-white border border-bdr rounded-btn px-3 py-1.5 text-sm" />
                  {parseChildren(t.childrenRaw).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">{parseChildren(t.childrenRaw).map((c) => <Pill key={c} className="bg-white border border-bdr text-t2">{c}</Pill>)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={save} disabled={!name.trim()}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }



export default Categories;
