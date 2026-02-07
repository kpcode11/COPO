import { redirect } from 'next/navigation'

export default function GlobalConfigPage() {
  redirect('/admin/settings')
}
