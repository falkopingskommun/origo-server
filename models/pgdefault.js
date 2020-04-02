var pgDefault = function pgDefault(queryString, queryOptions, defaultLimit) {
  var schema = queryOptions.schema;
  var table = queryOptions.table;
  var searchField = queryOptions.searchField;
  var gid = queryOptions.gid || 'gid';
  var sqlSearchField = searchField ? 'CAST(' + table + '."' + searchField + '" AS TEXT) AS "NAMN",' : "";
  var fields = queryOptions.fields;
  var geometryField = queryOptions.geometryName || "geom";
//var centroid = 'ST_AsText(ST_PointOnSurface(' + table + '."' + geometryField + '")) AS "GEOM" ';
  var centroid = 'ST_AsText(geom) AS "GEOM"';
  var sqlFields = fields ? fields.join(',') + "," : "";
  var type = " '" + table + "'" + ' AS "TYPE", ';
  var condition = queryString;
  var searchString;
  var limitNumber = queryOptions.limit || defaultLimit || 1000;
  var limit = ' LIMIT ' + limitNumber.toString() + ' ';
  var layerNamn = queryOptions.layer;
  var layer = " '" + layerNamn + "'" + ' AS "LAYER", ';

  searchString =
    'SELECT ' +
    sqlSearchField +
    ' ' + table + '."' + gid + '" AS "GID", ' +
    type +
    layer +
    centroid +
    ' FROM ' + schema + '.' + table +
    ' WHERE LOWER(CAST(' + table + '."' + searchField + '"' + " AS TEXT)) ILIKE LOWER('" + condition + "%')" +
    ' ORDER BY ' + table + '."' + searchField + '"' +
    limit + ';';

  return searchString;
}

module.exports = pgDefault;
