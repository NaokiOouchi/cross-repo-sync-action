import * as fs from 'fs/promises'
import * as path from 'path'

export interface ExpandedMapping {
  readonly src: string
  readonly dest: string
  readonly delete?: boolean
}

export const isDirectoryPath = (filePath: string): boolean =>
  filePath.endsWith('/')

export const expandDirectoryMapping = async (
  src: string,
  dest: string,
  deleteOrphans?: boolean
): Promise<readonly ExpandedMapping[]> => {
  if (!isDirectoryPath(src)) {
    return [{ src, dest, delete: deleteOrphans }]
  }

  const files = await listFilesRecursively(src)
  return files.map((file) => {
    const relativePath = path.relative(src, file)
    return {
      src: file,
      dest: path.join(dest, relativePath),
      delete: deleteOrphans,
    }
  })
}

const listFilesRecursively = async (dir: string): Promise<readonly string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await listFilesRecursively(fullPath)
      results.push(...nested)
    } else {
      results.push(fullPath)
    }
  }

  return results.sort()
}
