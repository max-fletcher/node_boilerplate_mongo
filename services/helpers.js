const paginate = async (req, model, options, limit = 10, currentPage = 1) => {
  limit = parseInt(limit)
  currentPage = parseInt(currentPage)

  const offset = (currentPage - 1) * limit

  if(options.search && Object.keys(options.search).length){
    options.where = { ...options.search, ...options.where } // Order here matters. ...options.where is declared later so it will override ...options.search if conditions overlap
  }

  console.log(options);

  let query = null
  countQuery = null
  if(options.where && Object.keys(options.where).length){
    query = model.find(options.where)
    countQuery = model.countDocuments(options.where)
  }
  else{
    query = model.find()
    countQuery = model.countDocuments()
  }

  if(options.select && options.select.length){
    query = query.select(options.select)
  }

  if(options.relations && options.relations.length){
    relations.map((rel) => {
      query = query.populate(rel)
    })
  }

  const data = await query.limit(limit).skip(offset).exec()
  const pageDataCount = data.length
  const totalDataCount = await countQuery.exec()
  let totalPages = Math.ceil(totalDataCount/limit)
  const next = currentPage < totalPages ? `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path.substring(0, req.path - 1)}?page=${(parseInt(currentPage)+1)}limit=${limit}search=${options.search}` : null
  const previous = (currentPage > 1 && currentPage <= totalPages) ? `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path.substring(0, req.path - 1)}?page=${(parseInt(currentPage)-1)}limit=${limit}search=${options.search}` : null

  return {
    pageDataCount,
    totalDataCount,
    currentPage,
    next,
    previous,
    data,
  }
}

module.exports = {
  paginate
}; 