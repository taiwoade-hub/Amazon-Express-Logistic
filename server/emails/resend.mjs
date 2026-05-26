import { Resend } from 'resend'
import { getRequiredEnv } from '../env.mjs'

export const resend = new Resend(getRequiredEnv('RESEND_API_KEY'))

export const defaultFrom = String(process.env.RESEND_FROM || 'AmazonLogisics <contact@amazonlogisics.com>')
