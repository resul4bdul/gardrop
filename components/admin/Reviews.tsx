/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { date, Confirm, TableSkeleton, EmptyRow, Th, Td, Card, useLive } from "./shared";
import { MCard, MobileListState } from "../lib/iosUi";
import type { ApiFn, ToastFn, AdminReview } from "./types";

export function Reviews({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<AdminReview[] | null>(null);
    const [del, setDel] = useState<AdminReview | null>(null);
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<AdminReview[]>('/api/admin/reviews').then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));
    const remove = async (r: AdminReview) => {
      try { await api('/api/admin/reviews/' + r.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };
    return (
      <div>
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[680px]">
            <thead><tr className="bg-bg2"><Th>ID</Th><Th>Məhsul</Th><Th>Müştəri</Th><Th>Reytinq</Th><Th>Rəy</Th><Th>Tarix</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!rows ? <TableSkeleton cols={7} /> : rows.length === 0 ? <EmptyRow cols={7} text="Rəy yoxdur" /> : (
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-bdr row-h">
                    <Td className="text-t3">#{r.id}</Td>
                    <Td className="text-t2">#{r.productId}</Td>
                    <Td className="font-medium">{r.userName}</Td>
                    <Td className="text-amber">{'★'.repeat(r.rating)}<span className="text-td">{'★'.repeat(Math.max(0, 5 - r.rating))}</span></Td>
                    <Td className="max-w-[320px] truncate text-t2">{r.comment}</Td>
                    <Td className="text-t3 text-xs">{date(r.createdAt)}</Td>
                    <Td className="text-right"><button onClick={() => setDel(r)} className="text-sale hover:underline text-sm">Sil</button></Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Rəy yoxdur" />
          {rows && rows.map((r) => (
            <MCard key={r.id}
              title={r.userName}
              subtitle={<>Məhsul #{r.productId} · {date(r.createdAt)}</>}
              badge={<span className="text-amber text-sm">{'★'.repeat(r.rating)}<span className="text-td">{'★'.repeat(Math.max(0, 5 - r.rating))}</span></span>}
              rows={r.comment ? [['Rəy', r.comment]] : []}
              actions={<button onClick={() => setDel(r)} className="text-sale font-medium ml-auto">Sil</button>}
            />
          ))}
        </div>
        {del && <Confirm text="Bu rəyi silmək istəyirsiniz?" onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }



export default Reviews;
