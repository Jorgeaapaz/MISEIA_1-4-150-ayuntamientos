'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfigSede } from '@/lib/types';

export default function AdminSedePage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token, refreshSede, configSede } = useGlobal();

  const [form, setForm] = useState<Partial<ConfigSede>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (configSede) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm({
        nombreAyuntamiento: configSede.nombreAyuntamiento,
        colorAccent: configSede.colorAccent,
        bienvenida: configSede.bienvenida,
        emailContacto: configSede.emailContacto,
        direccion: configSede.direccion,
        telefono: configSede.telefono,
        logoUrl: configSede.logoUrl,
        slug: configSede.slug,
      });
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [configSede]);

  const handleChange = (field: keyof ConfigSede, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/sede', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await refreshSede();
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[--foreground]">Configuración de la sede</h1>
          <p className="text-sm text-[--muted] mt-1">Personaliza la identidad y datos de contacto de tu sede electrónica.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Card>
              <CardHeader title="Identidad" />
              <div className="space-y-4">
                <Input
                  label="Nombre del ayuntamiento"
                  value={form.nombreAyuntamiento || ''}
                  onChange={(e) => handleChange('nombreAyuntamiento', e.target.value)}
                  placeholder="Ayuntamiento de…"
                  required
                />
                <Input
                  label="Slug (identificador único)"
                  value={form.slug || ''}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="ayto-nombre"
                  hint="Solo letras minúsculas, números y guiones."
                  required
                />
                <Input
                  label="URL del logo"
                  value={form.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                    Color de acento
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.colorAccent || '#3B82F6'}
                      onChange={(e) => handleChange('colorAccent', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-[--border] bg-transparent"
                    />
                    <Input
                      value={form.colorAccent || '#3B82F6'}
                      onChange={(e) => handleChange('colorAccent', e.target.value)}
                      placeholder="#3B82F6"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Texto de bienvenida" />
              <Textarea
                label="Mensaje principal de la home"
                value={form.bienvenida || ''}
                onChange={(e) => handleChange('bienvenida', e.target.value)}
                placeholder="Bienvenido a la sede electrónica de…"
                className="min-h-[100px]"
              />
            </Card>

            <Card>
              <CardHeader title="Datos de contacto" />
              <div className="space-y-4">
                <Input
                  label="Email de contacto"
                  value={form.emailContacto || ''}
                  onChange={(e) => handleChange('emailContacto', e.target.value)}
                  placeholder="sede@ayuntamiento.es"
                  type="email"
                  required
                />
                <Input
                  label="Dirección"
                  value={form.direccion || ''}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Plaza Mayor, 1…"
                />
                <Input
                  label="Teléfono"
                  value={form.telefono || ''}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="900 000 000"
                  type="tel"
                />
              </div>
            </Card>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                Configuración guardada correctamente.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
