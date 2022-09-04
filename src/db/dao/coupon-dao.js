const { isNumber } = require('../../utils/number');
const { DAO } = require('./dao');
const { StoreDAO } = require('./store-dao');

const selectCoupons = `
SELECT c.id, c.code, c.valid_until, c.description 
FROM coupon c
JOIN public.store s ON s.id = c.store_id
WHERE lower(s.name) LIKE lower($1);`;

const addCoupon = `
INSERT INTO coupon (store_id, code, valid_until, description) VALUES ($1,$2,$3,$4);
`;

class CouponDAO extends DAO {
	constructor() {
		super();
		this.storeDAO = new StoreDAO();
	}

	async findCoupons(store) {
		const queryResult = (await this.query(selectCoupons, [store]));
		if (queryResult) {
			return queryResult.map(row => {
				row.valid_until = row.valid_until ? row.valid_until.toLocaleDateString() : null;
				return row;
			});
		}
		return null;
	}

	async addCoupon(store, code, date = null, description = null) {
		const formattedDate = date ? date.toSQLDate() : null ;
		if (isNumber(store)) {
			const toAddCoupon = await this.storeDAO.getStoreById(store);
			if (toAddCoupon && toAddCoupon.length === 1) {
				const answer = await this.query(addCoupon, [store, code, formattedDate, description]);
				if (answer) {
					return 'Se agrego el cupon a la tienda';
				}
				else {
					return 'Ocurrio un error al intentar agregar el cupon';
				}
			}
			else {
				return 'No existe tienda con el id';
			}
		}
		else {
			const byName = await this.storeDAO.findStoreByName(store);
			if (!byName) {
				return 'Ocurrio un error al buscar tiendas con ese nombre';
			}

			if (byName.length === 1) {
				const store_id = byName[0].id;
				return (
					await this.query(addCoupon, [store_id, code, formattedDate, description]) ?
						'Se agrego el cupon a la tienda' :
						'Ocurrio un error al intentar agregar el cupon'
				);
			}
			else if (byName.length === 0) {
				return 'No existe tienda con ese nombre';
			}
			else {
				return 'Existe mas de una tienda con ese nombre';
			}
		}
	}
}

exports.CouponDAO = CouponDAO;