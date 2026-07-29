import { ActivityPanel } from '@/components/ActivityPanel'
import { AtlasPositionField } from '@/components/AtlasPositionField'
import { PositionMetrics } from '@/components/PositionMetrics'

export default function Page() {
  return (
    <>
      <AtlasPositionField />
      <PositionMetrics />
      <ActivityPanel />
    </>
  )
}
