require 'date'
require 'tempfile'
require 'csv'

class Array
  def sum
    inject(0.0) { |result, el| result + el }
  end

  def mean 
    sum / size
  end
end

headers = ['"date"', '"uid"', '"gender"', '"age"', '"incentive"', '"amount"', '"amount_possible"']
rows = []
users = []
num_users = 100
incentives = [
  { name: 'steps', label: 'Step Tracking', likelyhood: 8, efficency: 0.9 }, 
  { name: 'sleep', label: 'Sleep Tracking', likelyhood: 6, efficency: 0.7 },
  { name: 'food', label: 'Food Tracking', likelyhood: 4, efficency: 0.5 }
]
day_of_week_likelyhood = {
  0 => 4,
  1 => 5,
  2 => 6,
  3 => 7,
  4 => 8,
  5 => 8,
  6 => 6
}
month_likelyhood = {
  1 => 3,
  2 => 4,
  3 => 6,
  4 => 6,
  5 => 7,
  6 => 7,
  7 => 8,
  8 => 9,
  9 => 7,
  10 => 5,
  11 => 4,
  12 => 3
}
genders = ['female','male']
daily_max = 5
start_date = Date.new(2014, 01, 01)
end_date = Date.new(2014, 12, 31)

num_users.times do |i|
  user = { 
    uid: (0...10).map { ('a'..'z').to_a[rand(26)] }.join,
    gender: genders[rand.round],
    age: 25 + (rand * 10).round + (rand * 10).round
  }
  # puts user
  users << user
end

puts headers.join(',')+"\n"

(start_date..end_date).each do |date|
  # puts date
  users.each do |user|
    incentives.each do |incentive|
      likelyhoods = rand*incentive[:likelyhood] + rand*day_of_week_likelyhood[date.wday] + rand*month_likelyhood[date.month]
      # puts likelyhoods
      if rand*30 < likelyhoods
        amount = (daily_max * rand(incentive[:efficency])).round
        if(amount > 0)
          row = [date, user[:uid], user[:gender], user[:age], incentive[:name], amount, daily_max]
          # rows << row
          puts row.join(',')+"\n"
        end
      end
    end
  end
end

# puts rows.join(',')+"\n"

# file = Tempfile.new('~/Dev/dc.js/tmp/incentives.csv')
# file = Tempfile.new('incentives')
# puts file.path
# CSV.open(file, 'w') do |csv|
#   csv << headers
#   rows.each do |row|
#     csv << row
#   end
# end



