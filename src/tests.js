import * as hyparquet from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

export const tests = [
  {
    name: 'read-first-rows',
    async runTest(file) {
      await hyparquet.parquetRead({
        file,
        compressors,
        rowEnd: 10000,
      })
    },
  },
  {
    name: 'read-single-row',
    async runTest(file) {
      await hyparquet.parquetRead({
        file,
        compressors,
        // near the end of the first rowgroup
        rowStart: 190000,
        rowEnd: 190001,
      })
    },
  },
  {
    name: 'read-int-column',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, columns: ['l_quantity'] })
    },
  },
  // not substantially different from int
  // {
  //   name: 'read-float-column',
  //   async runTest(file) {
  //     await hyparquet.parquetRead({ file, compressors, columns: ['l_discount'] })
  //   },
  // },
  {
    name: 'read-date-column',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, columns: ['l_shipdate'] })
    },
  },
  {
    name: 'read-string-column',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, columns: ['l_comment'] })
    },
  },
  {
    name: 'read-objects',
    async runTest(file) {
      await hyparquet.parquetReadObjects({ file, compressors, rowEnd: 300_000 })
    },
  },
  {
    name: 'read-with-row-limits',
    async runTest(file) {
      await hyparquet.parquetRead({
        file,
        compressors,
        rowStart: 2_200_000,
        rowEnd: 2_600_000,
      })
    },
  },
  {
    name: 'read-all-data',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors })
    },
  },
  {
    name: 'query-with-filter',
    async runTest(file) {
      await hyparquet.parquetQuery({ file, compressors, filter: { l_quantity: { $gte: 50 } }, rowEnd: 1000 })
    },
  },
  {
    name: 'query-with-sort',
    async runTest(file) {
      await hyparquet.parquetQuery({ file, compressors, orderBy: 'l_extendedprice', rowEnd: 10 })
    },
  },
]
