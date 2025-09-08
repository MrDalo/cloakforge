import { formatServiceIdentifier } from '@/lib/utils/transactionUtils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { SERVICE_IDENTIFIERS } from '@/lib/solana/serviceMemo'

// Service filter component
interface ServiceFilterProps {
  value: string
  onChange: (value: string) => void
}

const ServiceFilter = ({ onChange, value }: ServiceFilterProps): React.ReactNode => (
  <div className='flex items-center gap-2'>
    <label className='text-sm font-medium' htmlFor='service-filter'>
      Service:
    </label>
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className='w-48' id='service-filter'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>All Services</SelectItem>
        {Object.values(SERVICE_IDENTIFIERS).map((serviceId) => (
          <SelectItem key={serviceId} value={serviceId}>
            {formatServiceIdentifier(serviceId)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)
export default ServiceFilter
