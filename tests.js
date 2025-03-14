import * as hyparquet from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

export const tests = [
  {
    name: 'read-int-column',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, columns: ['l_quantity'] })
    },
  },
  {
    name: 'read-float-column',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, columns: ['l_discount'] })
    },
  },
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
    name: 'read-with-row-limits',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, rowStart: 2_000_000, rowEnd: 3_000_000 })
    },
  },
  {
    name: 'read-all-data',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors })
    },
  },
  {
    name: 'read-objects',
    async runTest(file) {
      await hyparquet.parquetReadObjects({ file, compressors, rowEnd: 1_000_000 })
    },
  },
  {
    name: 'query-with-sort',
    async runTest(file) {
      await hyparquet.parquetRead({ file, compressors, sort: 'l_extendedprice', rowEnd: 10000 })
    },
  },
  {
    name: 'query-with-filter',
    async runTest(file) {
      await hyparquet.parquetQuery({ file, compressors, filter: 'l_quantity > 20' })
    },
  },
]
