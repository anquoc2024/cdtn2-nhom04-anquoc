import { statsRepo } from '../repositories/statsRepo'
import { attempt, unwrap, AppError } from './errors'

// FR15 – UC15
export const statsService = {
  getStats: (from, to) =>
    attempt(async () => {
      if (!from || !to || from > to) throw new AppError('INVALID_RANGE')
      return unwrap(await statsRepo.get(from, to))
    }),
}
