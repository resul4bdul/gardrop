/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { date, Btn, Field, Pill, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, useLive } from "./shared";
import type { ApiFn, ToastFn, Me, AdminUser } from "./types";
import { downloadCsv, csvStamp, csvDate, csvBool } from "../lib/csv";
import { Switch, MCard, MobileListState } from "../lib/iosUi";

export function Users({ api, toast, me }: { api: ApiFn; toast: ToastFn; me: Me }) {
    const [rows, setRows] = useState<AdminUser[] | null>(null);
    const [search, setSearch] = useState('');
    const [edit, setEdit] = useState<AdminUser | null>(null);
    const [pwUser, setPwUser] = useState<AdminUser | null>(null);
    const [del, setDel] = useState<AdminUser | null>(null);

    const load = useCallback((silent?: boolean) => {
      if (!silent) setRows(null);
      api<AdminUser[]>('/api/admin/users' + (search ? '?search=' + encodeURIComponent(search) : '')).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
    }, [api, search, toast]);
    useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
    useLive(useCallback(() => load(true), [load]));

    const save = async (u: AdminUser) => {
      try {
        await api('/api/admin/users/' + u.id, { method: 'PUT', body: JSON.stringify(u) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (u: AdminUser) => {
      try { await api('/api/admin/users/' + u.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };
    const setPw = async (u: AdminUser, pw: string) => {
      try { await api('/api/admin/users/' + u.id + '/password', { method: 'POST', body: JSON.stringify({ password: pw }) }); toast('Şifrə yeniləndi'); setPwUser(null); }
      catch (e) { toast((e as Error).message, 'error'); }
    };

    return (
      <div>
        <Toolbar search={search} setSearch={setSearch}
          right={<button onClick={() => rows && downloadCsv(`istifadeciler_${csvStamp()}`, rows, [
            { key: 'id', label: 'ID' }, { key: 'ad', label: 'Ad' }, { key: 'soyad', label: 'Soyad' },
            { key: 'email', label: 'Email' }, { key: 'telefon', label: 'Telefon' }, { key: 'cins', label: 'Cins' },
            { key: 'isAdmin', label: 'Admin', map: (u) => csvBool(u.isAdmin) },
            { key: 'orderCount', label: 'Sifariş sayı' }, { key: 'cartCount', label: 'Səbət' }, { key: 'favCount', label: 'Seçilmiş' },
            { key: 'createdAt', label: 'Qeydiyyat', map: (u) => csvDate(u.createdAt) },
          ])} disabled={!rows || !rows.length} className="px-3 py-1.5 rounded-btn text-sm font-medium bg-white border border-bdr text-t2 hover:border-brand disabled:opacity-40" title="CSV ixrac">⬇ CSV</button>} />
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[760px]">
            <thead><tr className="bg-bg2">
              <Th>ID</Th><Th>Ad Soyad</Th><Th>Email</Th><Th>Telefon</Th><Th>Rol</Th><Th>Aktivlik</Th><Th>Qoşulub</Th><Th className="text-right">Əməliyyat</Th>
            </tr></thead>
            {!rows ? <TableSkeleton cols={8} /> : rows.length === 0 ? <EmptyRow cols={8} text="İstifadəçi tapılmadı" /> : (
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t border-bdr row-h">
                    <Td className="text-t3">#{u.id}</Td>
                    <Td className="font-medium">{u.ad} {u.soyad}{u.id === me.id && <span className="text-blue text-xs ml-1">(siz)</span>}</Td>
                    <Td>{u.email}</Td>
                    <Td className="text-t2">{u.telefon || '—'}</Td>
                    <Td>{u.isAdmin ? <Pill className="bg-blue/10 text-blue">Admin</Pill> : <Pill className="bg-bg3 text-t2">İstifadəçi</Pill>}</Td>
                    <Td className="text-t3 text-xs">{u.orderCount} sif · {u.cartCount} səbət · {u.favCount} bəyəni</Td>
                    <Td className="text-t3 text-xs">{date(u.createdAt)}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setEdit(u)} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setPwUser(u)} className="text-t2 hover:underline text-sm mr-3">Şifrə</button>
                      <button onClick={() => setDel(u)} disabled={u.id === me.id} className="text-sale hover:underline text-sm disabled:opacity-30 disabled:no-underline">Sil</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="İstifadəçi tapılmadı" />
          {rows && rows.map((u) => (
            <MCard key={u.id}
              lead={<div className="w-11 h-11 rounded-full bg-bg2 grid place-items-center text-sm font-bold text-t2 shrink-0">{`${(u.ad || '?')[0] || ''}${(u.soyad || '')[0] || ''}`.toUpperCase()}</div>}
              title={<>{u.ad} {u.soyad}{u.id === me.id && <span className="text-blue text-xs ml-1">(siz)</span>}</>}
              subtitle={u.email}
              badge={u.isAdmin ? <Pill className="bg-blue/10 text-blue">Admin</Pill> : <Pill className="bg-bg3 text-t2">User</Pill>}
              rows={[
                ['Telefon', u.telefon || '—'],
                ['Aktivlik', `${u.orderCount ?? 0} sif · ${u.cartCount ?? 0} səbət · ${u.favCount ?? 0} bəyəni`],
                ['Qoşulub', date(u.createdAt)],
              ]}
              actions={<>
                <button onClick={() => setEdit(u)} className="text-blue font-medium">Redaktə</button>
                <button onClick={() => setPwUser(u)} className="text-t2 font-medium">Şifrə</button>
                <button onClick={() => setDel(u)} disabled={u.id === me.id} className="text-sale font-medium ml-auto disabled:opacity-30">Sil</button>
              </>}
            />
          ))}
        </div>

        {edit && <UserEdit user={edit} onClose={() => setEdit(null)} onSave={save} />}
        {pwUser && <PasswordModal user={pwUser} onClose={() => setPwUser(null)} onSave={setPw} />}
        {del && <Confirm text={`"${del.ad} ${del.soyad}" istifadəçisini və bütün məlumatlarını (sifariş, ünvan, səbət) silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

export function UserEdit({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (u: AdminUser) => void }) {
    const [f, setF] = useState<AdminUser>({ ...user });
    const set = (k: keyof AdminUser) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
    return (
      <Modal title="İstifadəçini redaktə et" onClose={onClose}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ad" value={f.ad || ''} onChange={set('ad')} />
          <Field label="Soyad" value={f.soyad || ''} onChange={set('soyad')} />
          <Field label="Email" value={f.email || ''} onChange={set('email')} />
          <Field label="Telefon" value={f.telefon || ''} onChange={set('telefon')} />
          <label className="block">
            <span className="block text-xs font-semibold text-t2 mb-1">Cins</span>
            <select className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={f.cins || ''} onChange={set('cins')}>
              <option value="">—</option><option>Kişi</option><option>Qadın</option>
            </select>
          </label>
          <div className="col-span-2 flex items-center justify-between gap-2 bg-bg2 rounded-card px-3.5 py-3">
            <div><div className="text-sm font-medium">Admin icazəsi</div><div className="text-xs text-t3">İdarəetmə panelinə tam giriş</div></div>
            <Switch checked={!!f.isAdmin} onChange={(v) => setF({ ...f, isAdmin: v })} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={() => onSave(f)}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }

export function PasswordModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (u: AdminUser, pw: string) => void }) {
    const [pw, setPw] = useState('');
    return (
      <Modal title="Şifrəni sıfırla" onClose={onClose}>
        <p className="text-sm text-t2 mb-3"><b>{user.email}</b> üçün yeni şifrə təyin edin (min 6 simvol).</p>
        <Field label="Yeni şifrə" type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••" />
        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn disabled={pw.length < 6} onClick={() => onSave(user, pw)}>Yenilə</Btn>
        </div>
      </Modal>
    );
  }



export default Users;
