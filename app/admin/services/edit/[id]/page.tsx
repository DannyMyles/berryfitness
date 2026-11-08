import { redirect } from 'next/navigation'

// Services are created and edited in the editor on /admin/services.
export default function EditServiceRedirect() {
  redirect('/admin/services')
}
