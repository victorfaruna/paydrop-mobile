export const FONTS = {
  ClashDisplay: {
    Bold: 'ClashDisplay-Bold',
    Extralight: 'ClashDisplay-Extralight',
    Light: 'ClashDisplay-Light',
    Medium: 'ClashDisplay-Medium',
    Regular: 'ClashDisplay-Regular',
    Semibold: 'ClashDisplay-Semibold',
  },
  SpaceMono: 'SpaceMono',
} as const;

export type FontFamily = 
  | 'ClashDisplay-Bold'
  | 'ClashDisplay-Extralight'
  | 'ClashDisplay-Light'
  | 'ClashDisplay-Medium'
  | 'ClashDisplay-Regular'
  | 'ClashDisplay-Semibold'
  | 'SpaceMono';
