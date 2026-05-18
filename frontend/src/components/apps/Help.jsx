import { useState, useEffect } from 'react'
import { apiGet } from '../../hooks/useApi'

export default function Help() {
  const [content, setContent] = useState('Loading...')

  useEffect(() => {
    apiGet('/api/lore/help_file')
      .then(f => setContent(f.content))
      .catch(() => setContent('HELP.TXT — file unavailable.'))
  }, [])

  return <div className="file-viewer">{content}</div>
}
