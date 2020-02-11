var pgDefault = function pgDefault(queryString, queryOptions, defaultLimit) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var gid = queryOptions.gid || 'gid';
  var sqlSearchField = searchField ? table + '."' + searchField + '" AS "NAMN",' : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
  var centroid = 'ST_AsText(ST_PointOnSurface(' + table + '."' + geometryField + '")) AS "GEOM" ';
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + table + "'" + ' AS "TYPE", ';
  var condition = queryString;
  var searchString;
  var limitNumber = queryOptions.limit || defaultLimit || 1000;
  var limit = ' LIMIT ' + limitNumber.toString() + ' ';
  var layerNamne = queryOptions.layer;
  var layer = "'" + layerNamne + "' AS LAYER, ";

  searchString =
    'SELECT ' +
    sqlSearchField +
    ' ' + table + '."' + gid + '" AS "GID", ' +
    type +
    layer +
    centroid +
    ' FROM ' + schema + '.' + table +
    ' WHERE LOWER(' + table + '."' + searchField + '"' + ") ILIKE LOWER('" + condition + "%')" +
    ' ORDER BY ' + table + '."' + searchField + '"' +
    limit + ';';

  return searchString;
}

module.exports = pgDefault;
