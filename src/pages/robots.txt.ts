import type { APIRoute } from 'astro'
import { site } from '../config/site'
import { robotsTxt } from '../lib/build-mode'

export const GET: APIRoute = () =>
  new Response(robotsTxt(import.meta.env.MODE, site.url), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
