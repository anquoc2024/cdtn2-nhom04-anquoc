import { catalogRepo } from '../repositories/catalogRepo'
import { settingRepo } from '../repositories/settingRepo'
import { attempt, unwrap } from './errors'
import { camel } from './mapper'

export const DESIGNS_PER_PAGE = 8

// FR03, FR04, FR16 – công khai
export const catalogService = {
  getServiceCategories: () => attempt(async () => camel(unwrap(await catalogRepo.serviceCategories()))),
  getServices: (categoryId) => attempt(async () => camel(unwrap(await catalogRepo.services({ categoryId })))),
  getDesignCategories: () => attempt(async () => camel(unwrap(await catalogRepo.designCategories()))),
  getDesigns: (categoryId, page = 1) =>
    attempt(async () => {
      const from = (page - 1) * DESIGNS_PER_PAGE
      const { data, error, count } = await catalogRepo.designs({ categoryId, from, to: from + DESIGNS_PER_PAGE - 1 })
      if (error) throw error
      return { items: camel(data), page, limit: DESIGNS_PER_PAGE, total: count ?? 0 }
    }),
  getDesign: (id) =>
    attempt(async () => {
      const d = camel(unwrap(await catalogRepo.design(id)))
      d.services = (d.designServices ?? []).map((x) => x.services).filter((s) => s && s.isActive)
      return d
    }),
  getStoreInfo: () => attempt(async () => camel(unwrap(await settingRepo.get()))),
}
