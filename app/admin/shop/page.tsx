'use client';

import { money } from '@/app/lib/money'
import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag, ShoppingCart, DollarSign, PackageX,
  Plus, Eye as EyeIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardStats from '@/components/admin/DashboardStats';
import RecentActivity from '@/components/admin/RecentActivity';
import EmptyState from '@/components/ui/EmptyState';
import { orderService } from '@/app/api_services/orderService';
import { productService } from '@/app/api_services/productService';
import { Order, Product } from '@/types/commerce';
import { useDocumentTitle } from '@/app/lib/useDocumentTitle';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return 'status-badge status-badge-completed';
    case 'pending': return 'status-badge status-badge-pending';
    case 'shipped':
    case 'confirmed': return 'status-badge status-badge-processing';
    case 'cancelled': return 'status-badge status-badge-cancelled';
    default: return 'status-badge status-badge-inactive';
  }
};

export default function AdminDashboard() {
  useDocumentTitle('Shop overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.admin.getOrders().catch(() => []),
      productService.getProducts().catch(() => []),
    ])
      .then(([ordersData, productsData]) => {
        setOrders(ordersData);
        setProducts(productsData);
      })
      .catch(() => toast.error('Could not load shop data — is the commerce API running?'))
      .finally(() => setLoading(false));
  }, []);

  const revenue = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
    [orders]
  );
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [orders]
  );
  const topProducts = useMemo(() => {
    const salesByProduct = new Map<number, { name: string; sales: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId === null) continue;
        const existing = salesByProduct.get(item.productId) ?? { name: item.name, sales: 0, revenue: 0 };
        existing.sales += item.quantity;
        existing.revenue += item.price * item.quantity;
        salesByProduct.set(item.productId, existing);
      }
    }
    return [...salesByProduct.values()].sort((a, b) => b.sales - a.sales).slice(0, 4);
  }, [orders]);

  const stats = [
    { label: 'Products', value: products.length.toLocaleString(), icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Orders', value: orders.length.toLocaleString(), icon: ShoppingCart, color: 'from-green-500 to-green-600' },
    { label: 'Revenue (paid)', value: `${money(revenue)}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
    { label: 'Out of Stock', value: products.filter((p) => !p.inStock).length.toLocaleString(), icon: PackageX, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <a href="/admin/products/create" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          New Product
        </a>
      </div>

      {/* Commerce Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="admin-stats-card">
            <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="stat-value">{loading ? '…' : stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content + Users/Testimonials stats */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-[#007AA9] text-sm font-medium hover:underline">
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState compact icon={ShoppingCart} title="No orders yet" />
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="text-gray-700">{order.customerName}</td>
                      <td className="font-semibold text-[#007AA9]">{money(order.total)}</td>
                      <td>
                        <span className={getStatusColor(order.status)}>{order.status}</span>
                      </td>
                      <td>
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-[#007AA9] transition-colors inline-flex"
                        >
                          <EyeIcon size={16} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity (blog/testimonials/users) */}
        <RecentActivity />
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
          <a href="/admin/products" className="text-[#007AA9] text-sm font-medium hover:underline">
            View All
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    {loading ? (
                      <div className="text-center py-8 text-gray-400">Loading…</div>
                    ) : (
                      <EmptyState compact icon={ShoppingBag} title="No sales yet" />
                    )}
                  </td>
                </tr>
              ) : (
                topProducts.map((product) => (
                  <tr key={product.name}>
                    <td className="font-medium text-gray-900">{product.name}</td>
                    <td className="text-gray-700">{product.sales}</td>
                    <td className="font-semibold text-[#007AA9]">{money(product.revenue)}</td>
                    <td className="w-32">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AA9] rounded-full transition-all duration-300"
                          style={{ width: `${(product.sales / topProducts[0].sales) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
