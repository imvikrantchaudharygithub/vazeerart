// web/lib/fonts.ts
import {Anton, Bodoni_Moda, Instrument_Sans, Mrs_Saint_Delafield} from 'next/font/google'

const anton = Anton({weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-anton'})
const bodoni = Bodoni_Moda({weight: '400', style: 'italic', subsets: ['latin'], display: 'swap', variable: '--font-bodoni'})
const instrument = Instrument_Sans({weight: ['400', '600'], subsets: ['latin'], display: 'swap', variable: '--font-instrument'})
const delafield = Mrs_Saint_Delafield({weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-delafield'})

export const fontVariables = [anton.variable, bodoni.variable, instrument.variable, delafield.variable].join(' ')
