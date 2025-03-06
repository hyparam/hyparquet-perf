import { createWriteStream, promises as fs } from 'fs'
import { parquetQuery, parquetRead } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { pipeline } from 'stream/promises'

export const tests = [
  {
    name: 'read-all-data',
    async runTest(file) {
      await parquetRead({ file, compressors })
    },
  },
  {
    name: 'read-int-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_quantity'] })
    },
  },
  {
    name: 'read-float-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_discount'] })
    },
  },
  {
    name: 'read-date-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_shipdate'] })
    },
  },
  {
    name: 'read-string-column',
    async runTest(file) {
      await parquetRead({ file, compressors, columns: ['l_comment'] })
    },
  },
  {
    name: 'read-with-row-limits',
    async runTest(file) {
      await parquetRead({ file, compressors, rowStart: 2_000_000, rowEnd: 3_000_000 })
    },
  },
  {
    name: 'query-with-sort',
    async runTest(file) {
      await parquetRead({ file, compressors, sort: 'l_orderkey', rowEnd: 100 })
    },
  },
  {
    name: 'query-with-filter',
    async runTest(file) {
      await parquetQuery({ file, compressors, filter: 'l_quantity > 20' })
    },
  },
]
